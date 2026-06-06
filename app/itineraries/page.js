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
        <div className="itinerary-page-shell" style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: 150, paddingBottom: 100 }}>
            {/* ── Sticky Scroll Header ── */}
            <StickyHeader activeTab={activeTab} scrolled={scrolled} scrollToSection={scrollToSection} />
            <div className="container">

                {/* Header Section */}
                <HeaderSection />

                {/* Gallery Section */}
                <GallerySection />

                {/* ── Main Content Grid ── */}
                <div className="itinerary-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 40, alignItems: 'flex-start' }}>

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
            <style jsx>{`
                @media (max-width: 991px) {
                    .itinerary-page-shell {
                        padding-top: 118px !important;
                        padding-bottom: 64px !important;
                    }

                    .itinerary-main-grid {
                        grid-template-columns: 1fr !important;
                        gap: 26px !important;
                    }

                    .itinerary-main-grid > div:last-child {
                        order: -1;
                    }

                    :global(.sample-highlights-grid),
                    :global(.sample-inclusions-grid) {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 22px !important;
                    }

                    :global(.sample-visa-card) {
                        display: grid !important;
                        grid-template-columns: 180px 1fr !important;
                    }
                }

                @media (max-width: 640px) {
                    .itinerary-page-shell {
                        padding-top: 102px !important;
                    }

                    :global(.sample-gallery-grid) {
                        grid-template-columns: 1fr !important;
                        grid-template-rows: none !important;
                        border-radius: 14px !important;
                    }

                    :global(.sample-gallery-grid > div) {
                        grid-row: auto !important;
                        min-height: 190px;
                    }

                    :global(.sample-highlights-grid),
                    :global(.sample-inclusions-grid) {
                        grid-template-columns: 1fr !important;
                    }

                    :global(.sample-visa-card) {
                        display: block !important;
                    }

                    :global(.sample-visa-card > div:first-child) {
                        width: 100% !important;
                        height: 180px;
                    }
                }
            `}</style>
        </div>
    );
}
