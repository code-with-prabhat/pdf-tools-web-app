import Head from 'next/head';
import Link from 'next/link';

const Layout = ({ children, title, description }) => {
  return (
    <div className="container">
      <Head>
        <title>{title || 'PDF Tools'}</title>
        <meta name="description" content={description || 'PDF tools for converting, editing and optimizing'} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="header">
        <h1>{title || 'PDF Tools'}</h1>
      </header>

      <main>
        {children}
      </main>

      <footer className="footer">
        <p>PDF Tools - All your PDF needs in one place</p>
      </footer>
    </div>
  );
};

export default Layout; 