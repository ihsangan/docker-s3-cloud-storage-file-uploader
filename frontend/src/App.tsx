import React from 'react';
import FileUploader from './components/FileUploader';

function App(): React.JSX.Element {
    return (
      <>
        <header>
          <h1>File Uploader</h1>
        </header>
        <main>
          <FileUploader />
        </main>
      </>
    );
}

export default App;
