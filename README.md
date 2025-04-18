# PDF Tools Suite

A comprehensive web application that provides essential PDF manipulation tools including image to PDF conversion, PDF compression, merging, and splitting.

## Features

### Image to PDF Converter
- Drag and drop image uploads
- High-quality PDF generation
- Customizable PDF settings (page size, orientation)
- Image quality control
- Ability to reorder images before conversion

### PDF Compressor
- Reduce PDF file size while maintaining quality
- Adjustable compression quality
- Before/after size comparison

### PDF Merger
- Combine multiple PDF files into a single document
- Drag-and-drop file uploads
- File reordering
- High-quality preservation

### PDF Splitter
- Extract specific pages from PDF documents
- Support for page ranges (e.g., 1, 3, 5-7)
- Page preview functionality
- High-quality output

## Technology Stack

- Next.js (React framework)
- jsPDF (PDF generation)
- PDF.js (PDF rendering)
- pdf-lib (PDF manipulation)

## How to Use

### Image to PDF Converter
1. Upload images by drag & drop or file selection
2. Arrange images with up/down controls
3. Customize PDF settings
4. Click "Generate PDF" to create your document

### PDF Compressor
1. Upload a PDF file
2. Adjust compression level if needed
3. Click "Compress PDF"
4. Download the compressed file

### PDF Merger
1. Upload multiple PDF files
2. Reorder them as needed
3. Click "Merge PDFs"
4. Download the combined document

### PDF Splitter
1. Upload a PDF file
2. Enter the page range to extract
3. Click "Extract Pages"
4. Download the extracted document

## Quality Preservation

This application focuses on preserving document quality by:
- Using direct PDF manipulation for merging and splitting
- Vector graphics preservation
- Maintaining text searchability and quality
- Optimizing for various document types

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/code-with-prabhat/pdf-tools-suite.git
cd pdf-tools-suite

# Install dependencies
npm install
# or
yarn install

# Run the development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Building for Production

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

## Docker Usage

### Building the Docker Image

To build the Docker image for this application, run:

```bash
docker build -t img2pdf .
```

### Running the Docker Container

Once the image is built, you can run it with:

```bash
docker run -p 3000:3000 img2pdf
```

The application will be available at http://localhost:3000

### Development with Docker Compose (Optional)

For development, you can create a docker-compose.yml file with:

```yaml
version: '3'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
    command: npm run dev
```

Then run:

```bash
docker-compose up
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
