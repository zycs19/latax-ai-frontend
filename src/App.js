import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
//import ErrorMessage from './components/ErrorMessage';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function App() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [latexContent, setLatexContent] = useState(`\\documentclass{article}
\\begin{document}
Enter your LaTeX content here...
\\end{document}`);

  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);

  const handleFileUpload = (event) => {
    setFiles(Array.from(event.target.files));
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && files.length === 0) return;

    const newMessages = [...messages, { role: 'user', content: inputMessage }];
    setMessages(newMessages);
    setInputMessage('');

    const formData = new FormData();
    formData.append('message', inputMessage);
    files.forEach(file => formData.append('files', file));

    try {
      const response = await axios.post('http://localhost:5001/api/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessages([...newMessages, { role: 'assistant', content: response.data.reply }]);
    } catch (error) {
      console.error('Error:', error);
      setError({
        message: 'An error occurred while sending the message',
        details: error.response?.data?.details || error.message,
      });
    }

    // Clear the file input after sending
    setFiles([]);
  };

  const handleLatexChange = (e) => {
    setLatexContent(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    const formData = new FormData();
    formData.append('latexFile', new Blob([latexContent], { type: 'text/plain' }), 'document.tex');

    try {
      const response = await axios.post('http://localhost:5001/api/latex-to-pdf', formData, {
        responseType: 'blob'
      });
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(pdfBlob));
    } catch (error) {
      console.error('Error:', error);
      setError({
        message: 'An error occurred while generating the PDF',
        details: error.response?.data?.details || error.message
      });
    }
  };

  const handleDownloadTex = () => {
    const element = document.createElement("a");
    const file = new Blob([latexContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "document.tex";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <PanelGroup direction="horizontal">
      <Panel minSize={20}>
        <div style={{ height: '100vh', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h2>Chat with AI</h2>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
            {messages.map((message, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <strong>{message.role === 'user' ? 'You: ' : 'AI: '}</strong>
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={tomorrow}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ))}
          </div>
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
            <input
              type="file"
              multiple
              accept="image/*,.txt,.pdf"
              onChange={handleFileUpload}
              style={{ marginBottom: '10px' }}
            />
            <small style={{ marginBottom: '10px', color: '#666' }}>
              You can upload images, text files, or PDFs. Images will be analyzed and described.
            </small>
            <div style={{ display: 'flex' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                style={{ flex: 1, marginRight: '10px' }}
              />
              <button type="submit">Send</button>
            </div>
          </form>
        </div>
      </Panel>

      <PanelResizeHandle style={{ width: '10px', background: '#ccc', cursor: 'col-resize' }} />

      <Panel minSize={20}>
        <div style={{ height: '100vh', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h2>LaTeX Editor</h2>
          <textarea
            value={latexContent}
            onChange={handleLatexChange}
            style={{ flex: 1, marginBottom: '10px', fontFamily: 'monospace' }}
            placeholder="Enter your LaTeX content here..."
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
            <button onClick={handleSubmit}>Convert to PDF</button>
            <button onClick={handleDownloadTex}>Download TEX</button>
          </div>
        </div>
      </Panel>

      <PanelResizeHandle style={{ width: '10px', background: '#ccc', cursor: 'col-resize' }} />

      <Panel minSize={20}>
        <div style={{ height: '100vh', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h2>PDF Viewer</h2>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
            {pdfUrl && (
              <Document file={pdfUrl}>
                <Page pageNumber={1} />
              </Document>
            )}
          </div>
          <button 
            onClick={handleDownloadPdf} 
            disabled={!pdfUrl}
            style={{ alignSelf: 'flex-start', marginBottom: '10px' }}
          >
            Download PDF
          </button>
          {error && (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              padding: '10px', 
              borderRadius: '5px', 
              marginTop: '10px'
            }}>
              <h3>Error</h3>
              <p>{error.message}</p>
              {error.details && <p>Details: {error.details}</p>}
            </div>
          )}
        </div>
      </Panel>
    </PanelGroup>
  );
}

export default App;
