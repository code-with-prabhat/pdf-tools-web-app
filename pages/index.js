import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import styles from '../styles/Tools.module.css';

export default function Home() {
  const router = useRouter();

  const tools = [
    {
      id: 'img2pdf',
      name: 'Image to PDF',
      description: 'Convert images to PDF without losing quality',
      icon: '🖼️',
      link: '/convert'
    },
    {
      id: 'compress',
      name: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      icon: '📁',
      link: '/tool/compress'
    },
    {
      id: 'merge',
      name: 'Merge PDFs',
      description: 'Combine multiple PDF files into one document',
      icon: '🔄',
      link: '/tool/merge'
    },
    {
      id: 'split',
      name: 'Split PDF',
      description: 'Extract pages from a PDF into separate files',
      icon: '✂️',
      link: '/tool/split'
    }
  ];

  const handleToolSelect = (toolId) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      router.push(tool.link);
    }
  };

  return (
    <Layout 
      title="PDF Tools - Convert, Compress, Merge, Split"
      description="All-in-one PDF tools for converting images to PDF, compressing, merging, and splitting PDF files without losing quality"
    >
      <div className="card">
        <h2>PDF Tools</h2>
        <p>Select a tool to get started</p>

        <div className={styles.toolGrid}>
          {tools.map(tool => (
            <div 
              key={tool.id} 
              className={styles.toolCard}
              onClick={() => handleToolSelect(tool.id)}
            >
              <div className={styles.toolIcon}>{tool.icon}</div>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Why Choose Our PDF Tools?</h2>
        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>✨ High Quality</h3>
            <p>All our tools preserve the quality of your original files</p>
          </div>
          <div className={styles.feature}>
            <h3>🔒 Privacy First</h3>
            <p>Your files are processed on your device, not on our servers</p>
          </div>
          <div className={styles.feature}>
            <h3>⚡ Fast Processing</h3>
            <p>Optimized algorithms for quick file processing</p>
          </div>
          <div className={styles.feature}>
            <h3>🧩 User Friendly</h3>
            <p>Simple and intuitive interfaces for all tools</p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 