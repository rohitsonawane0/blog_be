/**
 * Script to convert index.html to PDF
 * 
 * Usage: npx ts-node scripts/convert-resume-to-pdf.ts
 */

import * as path from 'path';
import { convertHtmlToPdf } from '../src/common/utils/pdf-generator.util';

async function main() {
    const projectRoot = path.resolve(__dirname, '..');
    const htmlPath = path.join(projectRoot, 'index.html');
    const pdfPath = path.join(projectRoot, 'resume.pdf');

    console.log('Starting HTML to PDF conversion...');
    console.log(`HTML file: ${htmlPath}`);
    console.log(`PDF output: ${pdfPath}`);

    const result = await convertHtmlToPdf({
        htmlPath,
        outputPath: pdfPath,
        deleteHtmlAfter: true, // Delete HTML after conversion
        pdfOptions: {
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                right: '15mm',
                bottom: '15mm',
                left: '15mm',
            },
        },
    });

    if (result.success) {
        console.log(`✅ Success! PDF saved to: ${result.pdfPath}`);
        console.log('✅ Original HTML file has been deleted.');
    } else {
        console.error(`❌ Failed: ${result.error}`);
        process.exit(1);
    }
}

main().catch(console.error);
