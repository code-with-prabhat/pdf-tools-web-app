import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '../../components/Layout';
import PDFCompressor from '../../components/PDFCompressor';
import PDFMerger from '../../components/PDFMerger';
import PDFSplitter from '../../components/PDFSplitter';

export default function Tool() {
  const router = useRouter();
  const { id } = router.query;

  const tools = {
    compress: {
      title: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      component: PDFCompressor
    },
    merge: {
      title: 'Merge PDFs',
      description: 'Combine multiple PDF files into one document',
      component: PDFMerger
    },
    split: {
      title: 'Split PDF',
      description: 'Extract pages from a PDF into separate files',
      component: PDFSplitter
    }
  };

  // If trying to access img2pdf directly, redirect to home
  useEffect(() => {
    if (id === 'img2pdf') {
      router.push('/convert');
    }
  }, [id, router]);

  // If tool doesn't exist, redirect to tools page
  useEffect(() => {
    if (id && !tools[id] && id !== 'img2pdf') {
      router.push('/');
    }
  }, [id, router]);

  if (!id || !tools[id]) {
    return (
      <Layout title="Loading..." description="Loading tool...">
        <div className="card">
          <h2>Loading...</h2>
        </div>
      </Layout>
    );
  }

  const tool = tools[id];
  const ToolComponent = tool.component;

  return (
    <Layout 
      title={tool.title}
      description={tool.description}
    >
      <ToolComponent />
    </Layout>
  );
} 