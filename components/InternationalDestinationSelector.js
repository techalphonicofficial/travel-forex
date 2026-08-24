'use client';

import React, { useState, useRef, useEffect } from 'react';

const COUNTRIES = [
  { name: 'Nepal', cities: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur'] },
  { name: 'Bhutan', cities: ['Thimphu', 'Paro', 'Punakha', 'Phuntsholing'] },
  { name: 'Mauritius', cities: ['Port Louis', 'Grand Baie', 'Flic en Flac', 'Trou aux Biches'] },
  { name: 'Seychelles', cities: ['Victoria', 'Beau Vallon', 'Praslin', 'La Digue'] },
  { name: 'Senegal', cities: ['Dakar', 'Saint-Louis', 'Touba', 'Thiès'] },
  { name: 'Rwanda', cities: ['Kigali', 'Musanze', 'Gisenyi', 'Butare'] },
  { name: 'Gambia', cities: ['Banjul', 'Serekunda', 'Brikama', 'Bakau'] },
  { name: 'Barbados', cities: ['Bridgetown', 'Speightstown', 'Oistins', 'Holetown'] },
  { name: 'Jamaica', cities: ['Kingston', 'Montego Bay', 'Ocho Rios', 'Negril'] },
  { name: 'Dominica', cities: ['Roseau', 'Portsmouth', 'Marigot', 'Berekua'] },
  { name: 'Haiti', cities: ['Port-au-Prince', 'Cap-Haïtien', 'Jacmel', 'Les Cayes'] },
  { name: 'Saint Vincent & Grenadines', cities: ['Kingstown', 'Georgetown', 'Bequia', 'Mustique'] },
  { name: 'Fiji', cities: ['Suva', 'Nadi', 'Lautoka', 'Savusavu'] },
  { name: 'Vanuatu', cities: ['Port Vila', 'Luganville', 'Tanna', 'Efaté'] },
  { name: 'Micronesia', cities: ['Palikir', 'Weno', 'Kolonia', 'Tofol'] },
  { name: 'Kiribati', cities: ['Tarawa', 'Betio', 'Bairiki', 'Bikenibeu'] },
  { name: 'Cook Islands', cities: ['Avarua', 'Aitutaki', 'Muri', 'Amuri'] },
  { name: 'Maldives', cities: ['Malé', 'Hulhumalé', 'Maafushi', 'Addu City'] },
  { name: 'Thailand', cities: ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi'] },
  { name: 'Indonesia', cities: ['Bali', 'Jakarta', 'Yogyakarta', 'Bandung'] },
  { name: 'Sri Lanka', cities: ['Colombo', 'Kandy', 'Galle', 'Negombo'] },
  { name: 'Ethiopia', cities: ['Addis Ababa', 'Lalibela', 'Axum', 'Gondar'] },
  { name: 'Azerbaijan', cities: ['Baku', 'Ganja', 'Sumqayit', 'Lankaran'] },
  { name: 'Vietnam', cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An'] },
  { name: 'Kenya', cities: ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu'] },
  { name: 'Cambodia', cities: ['Phnom Penh', 'Siem Reap', 'Sihanoukville', 'Battambang'] },
  { name: 'Tanzania', cities: ['Dar es Salaam', 'Zanzibar City', 'Arusha', 'Dodoma'] },
  { name: 'Cameroon', cities: ['Yaoundé', 'Douala', 'Garoua', 'Bamenda'] },
  { name: 'Burkina Faso', cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora'] },
  { name: 'Zimbabwe', cities: ['Harare', 'Bulawayo', 'Victoria Falls', 'Mutare'] },
  { name: 'Dubai (UAE)', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'] },
  { name: 'Philippines', cities: ['Manila', 'Cebu City', 'Boracay', 'Palawan'] },
  { name: 'Georgia', cities: ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi'] },
  { name: 'Kazakhstan', cities: ['Almaty', 'Astana', 'Shymkent', 'Karaganda'] },
  { name: 'USA', cities: ['New York', 'Los Angeles', 'Las Vegas', 'Miami', 'Orlando'] },
  { name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary'] },
  { name: 'Europe', cities: ['Paris', 'Rome', 'Barcelona', 'Amsterdam', 'Prague', 'Vienna', 'Zurich', 'Athens'] },
  { name: 'Australia', cities: ['Sydney', 'Melbourne', 'Gold Coast', 'Brisbane', 'Perth'] },
  { name: 'Bangladesh', cities: ['Dhaka', 'Chittagong', 'Sylhet', "Cox's Bazar"] },
  { name: 'China', cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Chengdu'] },
  { name: 'Turkey', cities: ['Istanbul', 'Antalya', 'Cappadocia', 'Ankara'] },
  { name: 'Singapore', cities: ['Singapore'] },
  { name: 'Korea', cities: ['Seoul', 'Busan', 'Jeju City', 'Incheon'] },
  { name: 'South Africa', cities: ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria'] },
  { name: 'Japan', cities: ['Tokyo', 'Kyoto', 'Osaka', 'Sapporo'] },
  { name: 'United Kingdom', cities: ['London', 'Edinburgh', 'Manchester', 'Bath'] },
  { name: 'Ireland', cities: ['Dublin', 'Galway', 'Cork', 'Killarney'] },
  { name: 'New Zealand', cities: ['Auckland', 'Queenstown', 'Wellington', 'Christchurch'] },
];

export default function InternationalDestinationSelector({ selectedCity, onSelectCity }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryIndex, setSelectedCountryIndex] = useState(0);
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

  const filteredCountries = COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeCountry = filteredCountries[selectedCountryIndex] || filteredCountries[0];

  return (
    <div className="intl-destination-selector" ref={containerRef} style={{ position: 'relative', zIndex: 50, marginBottom: '24px' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .intl-dropdown-trigger {
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
        .intl-dropdown-trigger:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          border-color: var(--color-primary);
        }
        .intl-popover {
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
        .intl-popover.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .intl-country-list {
          flex: 1;
          overflow-y: auto;
          border-right: 1px solid #f3f4f6;
          padding: 12px 0;
        }
        .intl-country-item {
          padding: 12px 24px;
          cursor: pointer;
          font-weight: 500;
          color: #4b5563;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .intl-country-item:hover {
          background: #f9fafb;
          color: var(--color-primary);
        }
        .intl-country-item.active {
          background: rgba(16, 185, 129, 0.08); /* Primary color low opacity */
          color: var(--color-primary);
          border-right: 3px solid var(--color-primary);
        }
        .intl-city-list {
          flex: 1.5;
          padding: 24px;
          overflow-y: auto;
          background: #fdfdfd;
        }
        .intl-city-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
        .intl-city-card {
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
        .intl-city-card:hover {
          border-color: var(--color-primary);
          box-shadow: 0 4px 12px rgba(16,185,129,0.15);
          color: var(--color-primary);
          transform: translateY(-2px);
        }
        .intl-search-input {
          width: 100%;
          padding: 16px 24px;
          border: none;
          border-bottom: 1px solid #f3f4f6;
          font-size: 16px;
          outline: none;
          color: #111827;
        }
        .intl-search-input::placeholder {
          color: #9ca3af;
        }
      `}} />

      <div className="intl-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div>
          <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Explore International Destinations</span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginTop: '4px' }}>
            {selectedCity ? `Selected: ${selectedCity}` : 'Where do you want to go?'}
          </div>
        </div>
        <div style={{ background: isOpen ? 'var(--color-primary)' : '#f3f4f6', color: isOpen ? 'white' : '#6b7280', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <div className={`intl-popover ${isOpen ? 'open' : ''}`}>
        <input 
          type="text" 
          className="intl-search-input" 
          placeholder="Search for a country..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSelectedCountryIndex(0); }}
        />
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Countries Column */}
          <div className="intl-country-list">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => (
                <div 
                  key={country.name} 
                  className={`intl-country-item ${index === selectedCountryIndex ? 'active' : ''}`}
                  onClick={() => setSelectedCountryIndex(index)}
                  onMouseEnter={() => setSelectedCountryIndex(index)}
                >
                  <span>{country.name}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ opacity: index === selectedCountryIndex ? 1 : 0.2 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', color: '#9ca3af', textAlign: 'center' }}>No countries found</div>
            )}
          </div>

          {/* Cities Column */}
          <div className="intl-city-list">
            {activeCountry ? (
              <>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 800, color: '#111827' }}>
                  Popular in {activeCountry.name}
                </h4>
                <div className="intl-city-grid">
                  {activeCountry.cities.map(city => (
                    <div 
                      key={city} 
                      className="intl-city-card"
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
                Select a country to view cities
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
