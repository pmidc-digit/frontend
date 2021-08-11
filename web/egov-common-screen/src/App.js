import React from 'react';
import './App.css';
import { Grid } from '@material-ui/core';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Cards from './components/Cards';
import Faqs from './components/Faqs';
import Message from './components/Message';
import Footer from './components/Footer';
import Testimonials from './components/Testimonials';



function App() {
  return (
    
   // <Grid className="app-grid">
   // <LandingPage />
   <div>
   <Header />
   <Cards />
   <Message />
   <center ><p  style ={{  fontFamily: "Roboto",
  fontStyle: "normal",
  fontWeight: "500",
  fontSize: "36px",
  lineHeight: "42px",
  textAlign: "center",
  color:"rgba(0, 0, 0, 0.87)"
  }}>Frequently Asked Questions</p></center >
  <div  
              style={{marginLeft: "45%",
                marginRight: "45%", marginTop: "-1%", borderBottom: "5px solid #f48952"}}>     
                </div> 
   <Faqs />
   <center ><p  style ={{fontFamily: "Roboto",
  fontStyle: "normal",
  fontWeight: "500",
  fontSize: "36px",
  lineHeight: "42px",
  textAlign: "center",
  color:"rgba(0, 0, 0, 0.87)"}}>User Testimonials</p>
   </center >
   <div  
              style={{marginLeft: "45%", marginTop: "-1%",
                marginRight: "45%", borderBottom: "5px solid #f48952"}}>     
                </div>
  

<Testimonials />

   <Footer />
 </div>

    
   // </Grid>
  );
}
export default App;