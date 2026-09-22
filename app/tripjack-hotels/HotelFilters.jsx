'use client';

import { Form, Button } from 'react-bootstrap';

const RATING_FILTERS = [0, 3, 4, 4.5, 5];

export default function HotelFilters({
    filterRating,
    setFilterRating,

    priceRange,
    setPriceRange,
    maxPrice,

    filterAmenities,
    setFilterAmenities,
    allAmenities,

    filterRefundable,
    setFilterRefundable,

    filterAvailable,
    setFilterAvailable,

    onReset,
}) {
    return (
        <div className="tj-filter-sidebar" style={{marginTop:"50px"}}>

            {/* STAR RATING */}
            <div className="mb-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <span className="tj-filter-icon">★</span>
                    Star Rating
                </h6>

                <div className="d-flex flex-column gap-2">
                    {RATING_FILTERS.map((rating) => (
                        <Form.Check
                            key={rating}
                            type="radio"
                            id={`rating-${rating}`}
                            name="ratingFilter"
                            label={
                                rating === 0
                                    ? 'All Ratings'
                                    : `${rating}+ Stars`
                            }
                            checked={filterRating === rating}
                            onChange={() => setFilterRating(rating)}
                            className="tj-filter-check"
                        />
                    ))}
                </div>
            </div>

            {/* PRICE */}
            <div className="mb-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <span className="tj-filter-icon">₹</span>
                    Price Range (per night)
                </h6>

                <div className="d-flex gap-2 align-items-center mb-2">
                    <Form.Control
                        type="number"
                        size="sm"
                        placeholder="Min"
                        value={priceRange[0]}
                        onChange={(e) =>
                            setPriceRange([
                                Number(e.target.value) || 0,
                                priceRange[1],
                            ])
                        }
                    />

                    <span className="text-muted">-</span>

                    <Form.Control
                        type="number"
                        size="sm"
                        placeholder="Max"
                        value={priceRange[1]}
                        onChange={(e) =>
                            setPriceRange([
                                priceRange[0],
                                Number(e.target.value) || maxPrice,
                            ])
                        }
                    />
                </div>

                <Form.Range
                    min={0}
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={(e) =>
                        setPriceRange([
                            priceRange[0],
                            Number(e.target.value),
                        ])
                    }
                />

                <div className="d-flex justify-content-between small text-muted">
                    <span>₹0</span>
                    <span>
                        ₹{maxPrice.toLocaleString('en-IN')}
                    </span>
                </div>
            </div>

            {/* AVAILABILITY */}
            <div className="mb-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <span className="tj-filter-icon">✓</span>
                    Availability
                </h6>

                <Form.Check
                    type="switch"
                    id="available-switch"
                    label="Show only available hotels"
                    checked={filterAvailable}
                    onChange={(e) =>
                        setFilterAvailable(e.target.checked)
                    }
                    className="tj-filter-check"
                />

                <Form.Check
                    type="switch"
                    id="refundable-switch"
                    label="Refundable only"
                    checked={filterRefundable}
                    onChange={(e) =>
                        setFilterRefundable(e.target.checked)
                    }
                    className="tj-filter-check mt-2"
                />
            </div>

            {/* AMENITIES */}
            {allAmenities.length > 0 && (
                <div className="mb-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                        <span className="tj-filter-icon">🏨</span>
                        Amenities
                    </h6>

                    <div
                        className="d-flex flex-column gap-2"
                        style={{
                            maxHeight: 200,
                            overflowY: 'auto',
                        }}
                    >
                        {allAmenities.map((amenity) => (
                            <Form.Check
                                key={amenity}
                                type="checkbox"
                                id={`amenity-${amenity}`}
                                label={amenity}
                                checked={filterAmenities.includes(
                                    amenity
                                )}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFilterAmenities([
                                            ...filterAmenities,
                                            amenity,
                                        ]);
                                    } else {
                                        setFilterAmenities(
                                            filterAmenities.filter(
                                                (item) =>
                                                    item !== amenity
                                            )
                                        );
                                    }
                                }}
                                className="tj-filter-check"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* RESET */}
            <Button
                variant="outline-secondary"
                size="sm"
                className="w-100"
                onClick={onReset}
            >
                Reset All Filters
            </Button>
        </div>
    );
}