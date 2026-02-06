import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export interface HtmlToPdfOptions {
    htmlPath: string;           // Path to the HTML file
    outputPath?: string;        // Optional: Path for the PDF output (defaults to same location as HTML)
    deleteHtmlAfter?: boolean;  // Optional: Delete the HTML file after conversion (default: true)
    pdfOptions?: puppeteer.PDFOptions; // Optional: Puppeteer PDF options
}

export interface PdfGeneratorResult {
    success: boolean;
    pdfPath?: string;
    error?: string;
}

/**
 * Converts an HTML file to PDF, saves it, and optionally deletes the HTML file
 */
export async function convertHtmlToPdf(options: HtmlToPdfOptions): Promise<PdfGeneratorResult> {
    const {
        htmlPath,
        outputPath,
        deleteHtmlAfter = true,
        pdfOptions = {},
    } = options;

    let browser: puppeteer.Browser | null = null;

    try {
        // Validate HTML file exists
        if (!fs.existsSync(htmlPath)) {
            return {
                success: false,
                error: `HTML file not found: ${htmlPath}`,
            };
        }

        // Determine output path for PDF
        const pdfPath = outputPath || htmlPath.replace(/\.html?$/i, '.pdf');

        // Launch headless browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        // Read HTML content and set it as page content
        const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0',
        });

        // Generate PDF with default options merged with custom options
        const defaultPdfOptions: puppeteer.PDFOptions = {
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm',
            },
        };

        await page.pdf({
            ...defaultPdfOptions,
            ...pdfOptions,
            path: pdfPath, // Ensure path is always set
        });

        // Close browser
        await browser.close();
        browser = null;

        // Delete HTML file if requested
        if (deleteHtmlAfter) {
            fs.unlinkSync(htmlPath);
            console.log(`Deleted HTML file: ${htmlPath}`);
        }

        console.log(`PDF generated successfully: ${pdfPath}`);

        return {
            success: true,
            pdfPath,
        };
    } catch (error) {
        // Ensure browser is closed on error
        if (browser) {
            await browser.close();
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`PDF generation failed: ${errorMessage}`);

        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Converts HTML string content to PDF and saves it
 */
export async function convertHtmlStringToPdf(
    htmlContent: string,
    outputPath: string,
    pdfOptions?: puppeteer.PDFOptions,
): Promise<PdfGeneratorResult> {
    let browser: puppeteer.Browser | null = null;

    try {
        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Launch headless browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        // Set HTML content
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0',
        });

        // Generate PDF
        const defaultPdfOptions: puppeteer.PDFOptions = {
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm',
            },
        };

        await page.pdf({
            ...defaultPdfOptions,
            ...pdfOptions,
            path: outputPath,
        });

        await browser.close();
        browser = null;

        console.log(`PDF generated successfully: ${outputPath}`);

        return {
            success: true,
            pdfPath: outputPath,
        };
    } catch (error) {
        if (browser) {
            await browser.close();
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`PDF generation failed: ${errorMessage}`);

        return {
            success: false,
            error: errorMessage,
        };
    }
}
