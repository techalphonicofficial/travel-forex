'use client';

import React, { useState, useRef, useEffect } from 'react';

const STATES = [
  { name: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Tirupati', 'Vijayawada', 'Amaravati'] },
  { name: 'Arunachal Pradesh', cities: ['Tawang', 'Itanagar', 'Ziro', 'Pasighat'] },
  { name: 'Assam', cities: ['Guwahati', 'Kaziranga', 'Majuli', 'Jorhat'] },
  { name: 'Bihar', cities: ['Patna', 'Bodh Gaya', 'Rajgir', 'Nalanda'] },
  { name: 'Chhattisgarh', cities: ['Raipur', 'Bhilai', 'Jagdalpur', 'Bilaspur'] },
  { name: 'Goa', cities: ['Panaji', 'Vasco da Gama', 'Margao', 'Calangute', 'Baga'] },
  { name: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Kutch'] },
  { name: 'Haryana', cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala'] },
  { name: 'Himachal Pradesh', cities: ['Shimla', 'Manali', 'Dharamshala', 'Dalhousie', 'Kullu'] },
  { name: 'Jharkhand', cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'] },
  { name: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Hampi', 'Coorg', 'Mangaluru'] },
  { name: 'Kerala', cities: ['Munnar', 'Kochi', 'Alleppey', 'Wayanad', 'Thiruvananthapuram'] },
  { name: 'Madhya Pradesh', cities: ['Bhopal', 'Indore', 'Gwalior', 'Ujjain', 'Khajuraho'] },
  { name: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Lonavala', 'Mahabaleshwar'] },
  { name: 'Manipur', cities: ['Imphal', 'Bishnupur', 'Ukhrul', 'Churachandpur'] },
  { name: 'Meghalaya', cities: ['Shillong', 'Cherrapunji', 'Dawki', 'Tura'] },
  { name: 'Mizoram', cities: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'] },
  { name: 'Nagaland', cities: ['Kohima', 'Dimapur', 'Mokokchung', 'Mon'] },
  { name: 'Odisha', cities: ['Bhubaneswar', 'Puri', 'Cuttack', 'Konark', 'Chilika'] },
  { name: 'Punjab', cities: ['Amritsar', 'Chandigarh', 'Ludhiana', 'Jalandhar'] },
  { name: 'Rajasthan', cities: ['Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Pushkar'] },
  { name: 'Sikkim', cities: ['Gangtok', 'Pelling', 'Lachung', 'Namchi'] },
  { name: 'Tamil Nadu', cities: ['Chennai', 'Ooty', 'Kodaikanal', 'Coimbatore', 'Madurai'] },
  { name: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam'] },
  { name: 'Tripura', cities: ['Agartala', 'Udaipur', 'Dharmanagar', 'Unakoti'] },
  { name: 'Uttar Pradesh', cities: ['Agra', 'Varanasi', 'Lucknow', 'Mathura', 'Ayodhya'] },
  { name: 'Uttarakhand', cities: ['Dehradun', 'Mussoorie', 'Nainital', 'Rishikesh', 'Haridwar'] },
  { name: 'West Bengal', cities: ['Kolkata', 'Darjeeling', 'Siliguri', 'Sundarbans'] },
  { name: 'Andaman and Nicobar', cities: ['Port Blair', 'Havelock Island', 'Neil Island'] },
  { name: 'Chandigarh', cities: ['Chandigarh'] },
  { name: 'Dadra & Nagar Haveli', cities: ['Silvassa', 'Daman', 'Diu'] },
  { name: 'Delhi', cities: ['New Delhi'] },
  { name: 'Jammu and Kashmir', cities: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Jammu'] },
  { name: 'Ladakh', cities: ['Leh', 'Kargil', 'Nubra Valley', 'Pangong'] },
  { name: 'Lakshadweep', cities: ['Kavaratti', 'Agatti', 'Minicoy'] },
  { name: 'Puducherry', cities: ['Pondicherry', 'Auroville', 'Karaikal', 'Mahe'] }
];

export default function DomesticDestinationSelector({ selectedCity, onSelectCity }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateIndex, setSelectedStateIndex] = useState(0);
  const containerRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStates = STATES.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeState = filteredStates[selectedStateIndex] || filteredStates[0];

  return (
    <div className="dom-destination-selector" ref={containerRef} style={{ position: 'relative', zIndex: 50, marginBottom: '24px' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .dom-dropdown-trigger {
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dom-dropdown-trigger:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          border-color: var(--color-primary);
        }
        .dom-popover {
          position: absolute;
          top: calc(100% + 12px);
          left: 0;
          right: 0;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.05);
          overflow: hidden;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          height: 400px;
        }
        .dom-popover.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .dom-state-list {
          flex: 1;
          overflow-y: auto;
          border-right: 1px solid #f3f4f6;
          padding: 12px 0;
        }
        .dom-state-item {
          padding: 12px 24px;
          cursor: pointer;
          font-weight: 500;
          color: #4b5563;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dom-state-item:hover {
          background: #f9fafb;
          color: var(--color-primary);
        }
        .dom-state-item.active {
          background: rgba(16, 185, 129, 0.08); /* Primary color low opacity */
          color: var(--color-primary);
          border-right: 3px solid var(--color-primary);
        }
        .dom-city-list {
          flex: 1.5;
          padding: 24px;
          overflow-y: auto;
          background: #fdfdfd;
        }
        .dom-city-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
        .dom-city-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          color: #374151;
        }
        .dom-city-card:hover {
          border-color: var(--color-primary);
          box-shadow: 0 4px 12px rgba(16,185,129,0.15);
          color: var(--color-primary);
          transform: translateY(-2px);
        }
        .dom-search-input {
          width: 100%;
          padding: 16px 24px;
          border: none;
          border-bottom: 1px solid #f3f4f6;
          font-size: 16px;
          outline: none;
          color: #111827;
        }
        .dom-search-input::placeholder {
          color: #9ca3af;
        }
      `}} />

      <div className="dom-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div>
          <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Explore Domestic Destinations</span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: '4px' }}>
            {selectedCity ? `Selected: ${selectedCity}` : 'Where do you want to go in India?'}
          </div>
        </div>
        <div style={{ background: isOpen ? 'var(--color-primary)' : '#f3f4f6', color: isOpen ? 'white' : '#6b7280', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <div className={`dom-popover ${isOpen ? 'open' : ''}`}>
        <input 
          type="text" 
          className="dom-search-input" 
          placeholder="Search for a state or union territory..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSelectedStateIndex(0); }}
        />
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* States Column */}
          <div className="dom-state-list">
            {filteredStates.length > 0 ? (
              filteredStates.map((state, index) => (
                <div 
                  key={state.name} 
                  className={`dom-state-item ${index === selectedStateIndex ? 'active' : ''}`}
                  onClick={() => setSelectedStateIndex(index)}
                  onMouseEnter={() => setSelectedStateIndex(index)}
                >
                  <span>{state.name}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ opacity: index === selectedStateIndex ? 1 : 0.2 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', color: '#9ca3af', textAlign: 'center' }}>No states found</div>
            )}
          </div>

          {/* Cities Column */}
          <div className="dom-city-list">
            {activeState ? (
              <>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 800, color: '#111827' }}>
                  Popular in {activeState.name}
                </h4>
                <div className="dom-city-grid">
                  {activeState.cities.map(city => (
                    <div 
                      key={city} 
                      className="dom-city-card"
                      onClick={() => {
                        onSelectCity(city);
                        setIsOpen(false);
                      }}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                Select a state to view cities
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
