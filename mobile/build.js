import fs from 'fs/promises';
import path from 'path';

// Define the path to the index.html file in the build directory
const indexPath = path.join(process.cwd(), 'build', 'index.html');
console.log(indexPath, 'indexp')
// Read the index.html file
fs.readFile(indexPath, 'utf8')
    .then(data => {
        // Replace the viewport meta tag
        const result = data.replace(
            '<meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1" />',
            '<meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1, maximum-scale=1" />'
        );

        // Write the modified content back to index.html
        return fs.writeFile(indexPath, result, 'utf8');
    })
    .then(() => {
        console.log('index.html modified successfully');
    })
    .catch(err => {
        console.error('Error modifying index.html:', err);
    });

