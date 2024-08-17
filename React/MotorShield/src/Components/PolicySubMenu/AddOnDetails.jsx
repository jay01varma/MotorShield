import React, { useState } from 'react';
import './AddOnDetails.css';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
 
const AddOnDetails = () => {
  const [err, setErr] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const [selectedInsuranceTypes, setSelectedInsuranceTypes] = useState({
    "Personal Cover": null,
    "Passenger Cover": null,
    "Breakdown Assistance": null
  });
 
  const location = useLocation();
  const navigate = useNavigate();
 
  const { vehicle_number } = location.state;
 
  const addOns = [
    {
      company: "Intact Insurance",
      options: [
        { name: "Personal Cover", description: "Provides financial protection in case of accidental injury, offering compensation for medical expenses.", price: 70 },
        { name: "Passenger Cover", description: "Offers compensation for medical expenses and accidental death or injury sustained during the journey.", price: 85 },
        { name: "Breakdown Assistance", description: "Offers timely support in case of vehicle malfunction such as towing, roadside repairs, and emergency transportation.", price: 45 },
      ],
      totalPremium: 200
    },
    {
      company: "Aviva",
      options: [
        { name: "Personal Cover", description: "Provides financial protection in case of accidental injury, offering compensation for medical expenses.", price: 80 },
        { name: "Passenger Cover", description: "Offers compensation for medical expenses and accidental death or injury sustained during the journey.", price: 100 },
        { name: "Breakdown Assistance", description: "Offers timely support in case of vehicle malfunction such as towing, roadside repairs, and emergency transportation.", price: 60 },
      ],
      totalPremium: 240
    },
    {
      company: "The Co-operators",
      options: [
        { name: "Personal Cover", description: "Financial protection for accidental injury, covering medical expenses.", price: 90 },
        { name: "Passenger Cover", description: "Compensation for medical expenses and accidental death or injury for passengers during the journey.", price: 110 },
        { name: "Breakdown Assistance", description: "Support for vehicle breakdowns including towing, roadside repairs, and emergency transportation.", price: 70 },
      ],
      totalPremium: 270
    },
    {
      company: "Desjardins Insurance",
      options: [
        { name: "Personal Cover", description: "Provides compensation for medical expenses in case of accidental injury.", price: 95 },
        { name: "Passenger Cover", description: "Offers financial compensation for medical expenses and accidental death or injury to passengers.", price: 115 },
        { name: "Breakdown Assistance", description: "Assistance for vehicle breakdowns such as towing and emergency repairs.", price: 75 },
      ],
      totalPremium: 285
    },
    {
      company: "RSA Insurance",
      options: [
        { name: "Personal Cover", description: "Provides compensation for medical expenses in case of accidental injury.", price: 100 },
        { name: "Passenger Cover", description: "Offers financial compensation for medical expenses and accidental death or injury to passengers.", price: 120 },
        { name: "Breakdown Assistance", description: "Assistance for vehicle breakdowns such as towing and emergency repairs.", price: 80 },
      ],
      totalPremium: 300
    },
    {
      company: "Economical Insurance",
      options: [
        { name: "Personal Cover", description: "Coverage for medical expenses due to accidental injuries.", price: 105 },
        { name: "Passenger Cover", description: "Financial compensation for passengers' medical expenses and accidental death or injury during travel.", price: 130 },
        { name: "Breakdown Assistance", description: "Services for vehicle breakdowns including towing and roadside repairs.", price: 85 },
      ],
      totalPremium: 320
    },
    {
      company: "Allianz",
      options: [
        { name: "Personal Cover", description: "Protection for medical expenses resulting from accidental injuries.", price: 110 },
        { name: "Passenger Cover", description: "Compensation for passengers' medical expenses and accidental death or injury during trips.", price: 140 },
        { name: "Breakdown Assistance", description: "Timely support for vehicle breakdowns such as towing and repairs.", price: 90 },
      ],
      totalPremium: 340
    },
    {
      company: "AIG",
      options: [
        { name: "Personal Cover", description: "Covers medical expenses due to accidental injuries.", price: 115 },
        { name: "Passenger Cover", description: "Compensation for passengers' medical expenses and accidental death or injury during travel.", price: 150 },
        { name: "Breakdown Assistance", description: "Support for vehicle breakdowns including towing and roadside assistance.", price: 95 },
      ],
      totalPremium: 360
    }
  ];
  
 
  const handleCheckboxChange = (company, optionName) => {
    setSelectedAddOns(prevState => ({
      ...prevState,
      [company]: {
        ...prevState[company],
        [optionName]: !prevState[company]?.[optionName]
      }
    }));
 
    setSelectedInsuranceTypes(prevState => ({
      ...prevState,
      [optionName]: prevState[optionName] === company ? null : company
    }));
  };
 
  const submitHandler = async (event) => {
    event.preventDefault();
  
    const token = localStorage.getItem("token");
    try {
      const selectedOptions = Object.entries(selectedInsuranceTypes)
        .filter(([optionName, company]) => company !== null)
        .map(([optionName, company]) => {
          const addOn = addOns.find(a => a.company === company).options.find(o => o.name === optionName);
          return {
            company,
            optionName,
            price: addOn.price
          };
        });
  
      const response = await axios.post('http://127.0.0.1:8000/add-policy/', {
        vehicle_number: vehicle_number,
        personal_accident: selectedInsuranceTypes["Personal Cover"] !== null,
        passenger_cover: selectedInsuranceTypes["Passenger Cover"] !== null,
        breakdown_assistance: selectedInsuranceTypes["Breakdown Assistance"] !== null,
        personal_accident_premium: selectedOptions.find(o => o.optionName === "Personal Cover")?.price || 0,
        passenger_cover_premium: selectedOptions.find(o => o.optionName === "Passenger Cover")?.price || 0,
        breakdown_assistance_premium: selectedOptions.find(o => o.optionName === "Breakdown Assistance")?.price || 0
      }, {
        headers: {
          Authorization: token ? `Bearer ${token}` : null
        }
      });
  
      console.log('Policy Created:', response.data.id);
      navigate('/');
    } catch (error) {
      if (error.response && error.response.data) {
        console.log(error.response.data);
        setErr(JSON.stringify(error.response.data));
      } else {
        setErr("An unexpected error occurred.");
      }
    }
  };
  
 
  const handlePrev = () => {
    setCurrentSlide((prev) => (prev === 0 ? addOns.length - 1 : prev - 1));
  };
 
  const handleNext = () => {
    setCurrentSlide((prev) => (prev === addOns.length - 1 ? 0 : prev + 1));
  };
 
  return (
    <div className='add-ons-page'>
      <h2 className="add-ons-title">Select the Add-ons</h2>
      <div className="selected-insurance-types">
        {Object.entries(selectedInsuranceTypes).map(([type, company]) => (
          <p key={type}>{type}: {company || "Not selected"}</p>
        ))}
      </div>
      <form onSubmit={submitHandler}>
        <div className="carousel">
          <button type="button" className="carousel-btn prev" onClick={handlePrev}>&lt;</button>
          <div className="add-card-container">
            <h3 className="company-title">{addOns[currentSlide].company}</h3>
            {addOns[currentSlide].options.map((option, index) => (
              <div key={index} className="add-card">
                <div className="addon">
                  <label htmlFor={`${addOns[currentSlide].company}-${option.name}`}>
                    <h3>{option.name}</h3>
                    <hr />
                    <p>{option.description}</p>
                    <br />
                    <p>${option.price} per month</p>
                  </label>
                  <input
                    type="checkbox"
                    id={`${addOns[currentSlide].company}-${option.name}`}
                    name={`${addOns[currentSlide].company}-${option.name}`}
                    checked={selectedAddOns[addOns[currentSlide].company]?.[option.name] || false}
                    onChange={() => handleCheckboxChange(addOns[currentSlide].company, option.name)}
                    disabled={selectedInsuranceTypes[option.name] && selectedInsuranceTypes[option.name] !== addOns[currentSlide].company}
                  />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="carousel-btn next" onClick={handleNext}>&gt;</button>
        </div>
        {err && <p className="vehicle-error">{err}</p>}
        <div className="add-on-btn-container">
          <button type="submit" className='btn light-btn'>Submit</button>
        </div>
      </form>
    </div>
  );
};
 
export default AddOnDetails;
