import { useState, } from 'react'
import Card from './components/Card'
import Header from './components/Header'
import Faq from './components/Faqs'
import Footer from './components/Footer'
import Privacy from './components/Privacy'
import Impersonation from './components/Impersonation'
import PropertyQRData from './components/propertyQRData'
import DisplayPropertyRecord from './components/propertyQRData/displayPropertyRecord'
import './App.css'
import PrivateRoute from './utils/privateRoute'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
function App() {
  const Layout = ({ children }) => {
    const location = useLocation();

    const hideHeaderFooter = location.pathname === "/propertyQRData" || location.pathname === "/displayPropertyRecord";

    return (
      <>
        {!hideHeaderFooter && <Header />}
        {children}
        {!hideHeaderFooter && <Footer />}
      </>
    );
  };

  return (
    <>

      {/* //basename="/common" */}
      <BrowserRouter basename="/">


        <Layout>
          <Routes>
            <Route path="/" element={<Card />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/impersonation" element={<Impersonation />} />
            <Route path="/propertyQRData" element={<PropertyQRData />} />
            <Route
              path="/displayPropertyRecord"
              element={
                <PrivateRoute>
                  <DisplayPropertyRecord />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Card />} />
          </Routes>
        </Layout>
        {/* ✅ ADD TOASTER HERE */}
        <Toaster position="bottom-center" />
      </BrowserRouter>
      {/* <Card />
      <center ><p style={{
        fontFamily: "Roboto",
        fontStyle: "normal",
        fontWeight: "500",
        fontSize: "36px",
        lineHeight: "42px",
        textAlign: "center",
        color: "rgba(0, 0, 0, 0.87)",
        marginLeft: "10%",
        marginRight: "10%"
      }}>Frequently Asked Questions</p></center >
      <div
        style={{
          marginLeft: "45%",
          marginRight: "45%", marginTop: "0%", borderBottom: "5px solid #f48952"
        }}>
      </div>
      <Faq /> */}

    </>
  )
}

export default App
