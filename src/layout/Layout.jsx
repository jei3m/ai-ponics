import React from 'react';
import Header from '../pages/components/Header';

const Layout = ({ children }) => {
  return (
    <>
      <div style={{overflowX: 'hidden'}}>
        <Header />
        <main>{children}</main>
      </div>
    </>
  );
};

export default Layout;