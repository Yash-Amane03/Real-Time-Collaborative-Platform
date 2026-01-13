const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const executeCode = async (req, res) => {
    const { language, code } = req.body;
    console.log('Received Execution Request:', { language, codeLength: code ? code.length : 0 });

    const jobId = uuidv4();
    const filename = `${jobId}.${getExtension(language)}`;
    const filePath = path.join(tempDir, filename);

    if (!code) {
        console.warn('Execution Blocked: No code provided');
        return res.status(400).json({ error: 'No code provided to execute.' });
    }

    if (!language) {
        console.warn('Execution Blocked: No language provided');
        return res.status(400).json({ error: 'No language specified.' });
    }

    try {
        await fs.promises.writeFile(filePath, code);

        let command;
        switch (language) {
            case 'javascript':
                command = `node "${filePath}"`;
                break;
            case 'python':
                command = `python "${filePath}"`; // Ensure python is in PATH
                break;
            case 'java':
                // For Java, we need to compile then run. 
                // Assumption: class name is Main or matching filename not strictly enforced by simple snippet
                // Java is tricky without a specific class name. 
                // Strategy: Rename file to Main.java and assume class is Main.
                const javaPath = path.join(tempDir, `${jobId}.java`);
                await fs.promises.rename(filePath, javaPath);
                command = `javac "${javaPath}" && java -cp "${tempDir}" Main`; // Fragile: assumes class Main
                // Better approach for simple snippets:
                // Let's just try running single file source code if Java 11+
                // command = `java "${filePath}"`;
                // Revert to reliable compile-run for broader support, assuming 'Main' class.
                // If user doesn't provide Main class, this fails. 
                // Let's stick to single-file source execution for simplicity if available, else standard.
                // We'll assume the user writes a class. 
                // Actually, let's just try to compile and run the .java file directly (Java 11+)
                command = `java "${javaPath}"`;
                break;
            case 'c':
                const outPathC = path.join(tempDir, `${jobId}.exe`);
                command = `gcc "${filePath}" -o "${outPathC}" && "${outPathC}"`;
                break;
            case 'cpp':
                const outPathCpp = path.join(tempDir, `${jobId}.exe`);
                command = `g++ "${filePath}" -o "${outPathCpp}" && "${outPathCpp}"`;
                break;
            default:
                return res.status(400).json({ error: 'Unsupported language' });
        }

        exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
            // Cleanup
            cleanup(jobId, language);

            console.log(`Execution Completed for ${jobId}:`);
            console.log('STDOUT:', stdout);
            console.log('STDERR:', stderr);
            console.log('ERROR:', error);

            if (error && error.killed) {
                console.warn('Execution Timed Out');
                return res.json({ output: 'Error: Time Limit Exceeded' });
            }
            if (error) {
                console.warn('Execution Error:', error.message);
                return res.json({ output: stderr || error.message });
            }
            res.json({ output: stdout || stderr });
        });

    } catch (err) {
        res.status(500).json({ error: 'Execution failed: ' + err.message });
    }
};

const getExtension = (lang) => {
    switch (lang) {
        case 'javascript': return 'js';
        case 'python': return 'py';
        case 'java': return 'java';
        case 'c': return 'c';
        case 'cpp': return 'cpp';
        default: return 'txt';
    }
};

const cleanup = (jobId, lang) => {
    const extensions = [getExtension(lang), 'exe', 'class'];
    // Also handle Java specific renaming if we did that
    if (lang === 'java') extensions.push('java');

    extensions.forEach(ext => {
        const file = path.join(tempDir, `${jobId}.${ext}`);
        if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    // Cleanup compiled class files generic
    const mainClass = path.join(tempDir, 'Main.class');
    if (fs.existsSync(mainClass)) fs.unlinkSync(mainClass);
};

module.exports = { executeCode };
