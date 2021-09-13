import React from "react";
import Faq from "react-faq-component";
import "./index.css";


const data = {
    title: "",
    rows: [
        {
            title: "How do I pay my property tax?",
            content: `You can pay your property tax by searching your property either with Unique Property Id / Old Property Id or with property details like mohalla, door number and owner name and using credit / debit cards, netbanking to make an online payment`,
        },
        {
            title: "What is the difference between Property Unique ID and Old Property ID?",
            content:
                "Old Property Id is an Id previously given by your Local body and can be found on your old payment receipts while Property Unique Id is an Id generated by NagarSewa system and can be seen post searching your property on this portal. You can search your property using both Ids",
        },
        {
            title: "Why should I apply for a Trade License?",
            content: `A Trade License is permission issued by an Urban Local Body (ULB) to conduct specific trade or business according to the relevant rules, standards and safety guidelines on premises for which it has been issued. Any unauthorised running of trade is an offence which may result in a substantial penalty and subsequent prosecution. Business owners must apply for Trade License before commencement of any trade.`,
        },       
    ],
};

const styles = {
    // bgColor: 'white',
    titleTextColor: "black",
    rowTitleColor: "black",
    rowTitleTextSize: "16px",
    // rowContentColor: 'grey',
    // arrowColor: "red",   
    rowContentPaddingTop:"12px",

};

const config = {
     animate: true,
     arrowIcon: "+",
    // tabFocus: true
};


export default function SectionFAQs() {

    return (
        <div id="faqs">
            <Faq
                data={data}
                styles={styles}
                config={config}
            />
        </div>
    );
}