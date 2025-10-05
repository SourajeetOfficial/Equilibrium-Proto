const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ProfessionalHelp = require('./models/ProfessionalHelp');

dotenv.config();
const connectDB = require('./config/db');

connectDB();

const resources = [
  {
    name: "Vandrevala Foundation Helpline",
    type: "NGO",
    location: {
      type: "Point",
      coordinates: [72.8777, 19.0760], // Mumbai (lon, lat)
    },
    address: "Mumbai, Maharashtra, India",
    contactInfo: "1860 2662 345 / 9999 666 555 | Email: help@vandrevalafoundation.com",
  },
  {
    name: "Snehi – Suicide Prevention Helpline",
    type: "NGO",
    location: {
      type: "Point",
      coordinates: [77.2090, 28.6139], // Delhi
    },
    address: "Delhi, India",
    contactInfo: "Helpline: +91-9582208181",
  },
  {
    name: "iCall – TISS Mental Health Helpline",
    type: "NGO",
    location: {
      type: "Point",
      coordinates: [72.8553, 19.0424], // TISS Mumbai
    },
    address: "Tata Institute of Social Sciences, Mumbai",
    contactInfo: "022-25521111 | icall@tiss.edu",
  },
  {
    name: "Sumaitri – Suicide Prevention Helpline",
    type: "NGO",
    location: {
      type: "Point",
      coordinates: [77.2090, 28.6139], // Delhi
    },
    address: "Delhi, India",
    contactInfo: "+91-11-23389090 | sumaitri1978@gmail.com",
  },
  {
    name: "Snehi – Delhi Based Mental Health NGO",
    type: "NGO",
    location: {
      type: "Point",
      coordinates: [77.1025, 28.7041], // Delhi
    },
    address: "B-2/11, Safdarjung Enclave, New Delhi",
    contactInfo: "011-26864488 / 011-26862222",
  },
  {
    name: "Government of India – KIRAN Helpline",
    type: "Government",
    location: {
      type: "Point",
      coordinates: [77.2167, 28.6667], // Central Govt Delhi
    },
    address: "National Mental Health Helpline",
    contactInfo: "Toll Free: 1800-599-0019",
  },
  {
    name: "KIRAN Helpline (National Govt)",
    type: "Government",
    address: "India (all states/UTs)",
    contactInfo: "1800-599-0019 | Toll-free, 24×7, 13 languages",  
    // approx central point -- say Delhi
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
  },
  {
    name: "Tele-MANAS (National Tele Mental Health Programme)",
    type: "Government",
    address: "India (all states/UTs)",
    contactInfo: "14416 / 1800-891-4416 | 24×7, multilingual support",  
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
  },
  {
    name: "Vandrevala Foundation Crisis Helpline",
    type: "NGO",
    address: "Mumbai, Maharashtra",
    contactInfo: "9999-666-555 | Also 1860-2662-345",  
    location: { type: "Point", coordinates: [72.8777, 19.0760] },
  },
  {
    name: "iCALL – TISS Psychosocial Helpline",
    type: "NGO",
    address: "Mumbai, Maharashtra",
    contactInfo: "022-25521111 | Mon-Sat, 8am-10pm",  
    location: { type: "Point", coordinates: [72.8553, 19.0424] },
  },
  {
    name: "Namah Free Anonymous Helpline",
    type: "NGO",
    address: "India (pan-India)",
    contactInfo: "84477 43665 | 24/7",  
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
  },
  {
    name: "Connecting Trust (Distress Helpline, Pune)",
    type: "NGO",
    address: "Pune, Maharashtra",
    contactInfo: "9922004305 / 9922001122 | Daily 10am-8pm",  
    location: { type: "Point", coordinates: [73.8567, 18.5204] },
  },
  {
    name: "AASRA (24/7 Emotional Support)",
    type: "NGO",
    address: "Mumbai, Maharashtra",
    contactInfo: "98204 66726 | 24 hours",  
    location: { type: "Point", coordinates: [72.8777, 19.0760] },
  },
  {
    name: "Sneha Foundation Mumbai",
    type: "NGO",
    address: "Mumbai, Maharashtra",
    contactInfo: "044-24640050 (if same number) or +91 89769 94777 (Mental Health Helpline)",  
    location: { type: "Point", coordinates: [72.8777, 19.0760] },
  },
  {
    name: "Fortis Healthcare Mental Health Helpline",
    type: "Private",
    address: "India (pan-India)",
    contactInfo: "8376804102 | 24/7",  
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
  },
  {
    name: "Jeevan Aastha Helpline (Gujarat Govt.)",
    type: "Government",
    address: "Gandhinagar, Gujarat",
    contactInfo: "1800-233-3330",  
    location: { type: "Point", coordinates: [72.5673, 23.2156] },
  },
  {
    name: "One Life Suicide Prevention & Crisis Support",
    type: "NGO",
    address: "Hyderabad / Telangana",
    contactInfo: "78930-78930",  
    location: { type: "Point", coordinates: [78.4867, 17.3850] },
  },
  {
    name: "Sahai (Bangalore)",
    type: "NGO",
    address: "Bangalore, Karnataka",
    contactInfo: "080-25497777",  
    location: { type: "Point", coordinates: [77.5946, 12.9716] },
  },
  {
    name: "Maithri (Kochi)",
    type: "NGO",
    address: "Kochi, Kerala",
    contactInfo: "91-484-2540530",  
    location: { type: "Point", coordinates: [76.2673, 9.9312] },
  },
  {
    name: "Serve (Kolkata)",
    type: "NGO",
    address: "Kolkata, West Bengal",
    contactInfo: "9830785060",  
    location: { type: "Point", coordinates: [88.3630, 22.5726] },
  },
  {
    name: "De-Feat Depression (Kolkata)",
    type: "NGO",
    address: "Kolkata, West Bengal",
    contactInfo: "9830027975",  
    location: { type: "Point", coordinates: [88.3630, 22.5726] },
  },
  {
    name: "Samaritans Mumbai",
    type: "NGO",
    address: "Mumbai, Maharashtra",
    contactInfo: "84229-84528 / 29 / 30",  
    location: { type: "Point", coordinates: [72.8777, 19.0760] },
  },
  {
    name: "Mpower Minds Helpline",
    type: "NGO",
    address: "India (pan-India)",
    contactInfo: "1800-120-820050 | 24×7",  
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
  },
  {
    name: "ASHA Helpline (GMCH Chandigarh)",
    type: "Government",
    address: "Chandigarh, Punjab/UT",
    contactInfo: "0172-2660078 / 2660178",  
    location: { type: "Point", coordinates: [76.7794, 30.7333] },
  },
  {
    name: "Save Shakti Foundation Helplines",
    type: "NGO",
    address: "India (pan-India / Karnataka / Tamil Nadu & others)",
    contactInfo: "080-46110007 (Psychosocial, MH Govt / NIMHANS), NIMHANS Perinatal: 81057-11277, Sneha India: 044-24640050",  
    location: { type: "Point", coordinates: [77.5937, 12.9716] },
  },
  {
    name: "Sneha India (Tamil Nadu)",
    type: "NGO",
    address: "Chennai, Tamil Nadu",
    contactInfo: "044-24640050",  
    location: { type: "Point", coordinates: [80.2707, 13.0827] },
  },
  {
    name: "Shakti Shalini Helpline",
    type: "NGO",
    address: "Delhi NCR",
    contactInfo: "011-24373737",  
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
  },
  {
    name: "Muktaa Mental Health Helpline",
    type: "NGO",
    address: "India / Karnataka (or local)",
    contactInfo: "788-788-9882",  
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
  },
  {
    name: "Prana Lifeline (Coimbatore)",
    type: "NGO",
    address: "Coimbatore, Tamil Nadu",
    contactInfo: "1800-121-2023040",  
    location: { type: "Point", coordinates: [76.9558, 11.0168] },
  },
  {
    name: "CooJ (Goa)",
    type: "NGO",
    address: "Goa",
    contactInfo: "9822562522",  
    location: { type: "Point", coordinates: [74.2179, 15.2993] },
  },
  {
    name: "Thanal (Kerala)",
    type: "NGO",
    address: "Kerala",
    contactInfo: "0495-2371100",  
    location: { type: "Point", coordinates: [76.2711, 9.5916] },
  },
  {
    name: "Prathyasa (Kerala)",
    type: "NGO",
    address: "Kerala",
    contactInfo: "91-480-2820091",  
    location: { type: "Point", coordinates: [76.2711, 9.5916] },
  },
  {
    name: "Pratheeksha (Kerala)",
    type: "NGO",
    address: "Kerala",
    contactInfo: "484-2448830",  
    location: { type: "Point", coordinates: [76.2711, 9.5916] },
  },
  {
    name: "SINGING SOULZ (Mumbai)",
    type: "NGO",
    address: "Mumbai, Maharashtra",
    contactInfo: "9892003868",  
    location: { type: "Point", coordinates: [72.8777, 19.0760] },
  },
  {
    name: "Mental Health Helpline by Dept of Empowerment of Persons with Disabilities",
    type: "Government",
    address: "India (DEPwD / central govt)",
    contactInfo: "Tele-Manas 14416; Psycho-social first-aid & counselling helpline 8448-8448-45; Vandrevala 9999-666-555; One Life 78930-78930; Jeevan Aastha 1800-233-3330",  
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
  },
  {
    name: "Stressed / Anxiety / Depression Helpline – Sthir",
    type: "NGO",
    address: "India (pan-India)",
    contactInfo: "1800-120-820050 | 24/7",  
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
  },
  {
    name: "SanJivini Society for Mental Health – Delhi",
    type: "NGO",
    address: "Delhi, India",
    contactInfo: "24311918 / 24311883",  
    location: { type: "Point", coordinates: [77.2090, 28.6139] },
  },
];

const importData = async () => {
  try {
    await ProfessionalHelp.deleteMany();
    await ProfessionalHelp.insertMany(resources);
    console.log("✅ Data Imported!");
    process.exit();
  } catch (error) {
    console.error("❌ Error importing data:", error);
    process.exit(1);
  }
};

importData();
