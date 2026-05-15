'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { sampleItinerary, navTabs } from './data';
import { StickyHeader, BookingSidebar, ReviewsSection, DayWiseItinerary, TripHighlights, HotelsSection, InclusionsExclusionsSection, TransfersSection, ActivitiesSection, PoliciesSection, FAQSection, HeaderSection, GallerySection, QuickInfoSection, MapSection, MainTabNavigation } from './components/ItineraryComponents';

export default function ItineraryPage() {
    const [activeTab, setActiveTab] = useState('itinerary');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        setActiveTab(id);
        const el = document.getElementById(id);
        if (el) {
            window.scrollTo({
                top: el.offsetTop - (scrolled ? 100 : 160),
                behavior: 'smooth'
            });
        }
    };

    const [inclusionSubTab, setInclusionSubTab] = useState('visa');
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: 150, paddingBottom: 100 }}>
            {/* ── Sticky Scroll Header ── */}
            <StickyHeader activeTab={activeTab} scrolled={scrolled} scrollToSection={scrollToSection} />
            <div className="container">

                {/* Header Section */}
                <HeaderSection />

                {/* Gallery Section */}
                <GallerySection />

                {/* ── Main Content Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 40, alignItems: 'flex-start' }}>

                    {/* Left Column */}
                    <div>
                        <MainTabNavigation activeTab={activeTab} scrollToSection={scrollToSection} />

                        {/* Quick Info Section */}
                        <QuickInfoSection />

                        {/* Day Wise Itinerary */}
                        <DayWiseItinerary />

                        {/* Trip Highlights Section */}
                        <TripHighlights scrollToSection={scrollToSection} />

                        {/* Hotels Section */}
                        <HotelsSection />

                        {/* Inclusions & Exclusions Section */}
                        <InclusionsExclusionsSection inclusionSubTab={inclusionSubTab} setInclusionSubTab={setInclusionSubTab} />

                        {/* Transfers Section */}
                        <TransfersSection />

                        {/* Activities Section */}
                        <ActivitiesSection />

                        {/* Policies Section */}
                        <PoliciesSection />
                    </div>

                    {/* Right Column (Sticky Sidebar) */}
                    <div>
                        <BookingSidebar />
                    </div>

                </div>

                {/* Map Section */}
                <MapSection />

                {/* Reviews Section */}
                <ReviewsSection
                    showReviewForm={showReviewForm}
                    setShowReviewForm={setShowReviewForm}
                    reviewRating={reviewRating}
                    setReviewRating={setReviewRating}
                />

                {/* FAQ Section */}
                <FAQSection />

            </div>
        </div>
    );
}
