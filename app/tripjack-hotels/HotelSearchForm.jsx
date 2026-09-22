'use client';



import { useMemo, useState } from 'react';



import {

    Row,

    Col,

    Form,

    Button,

    Card,

    Badge,

    Spinner,

    Dropdown,

    Collapse,

} from 'react-bootstrap';



function SearchableCountryDropdown({
    label,
    value,
    options = [],
    loading = false,
    placeholder = 'Select country',
    loadingText = 'Loading countries...',
    onChange,
    idPrefix = 'country',
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const selectedCountry = useMemo(() => {
        if (!value) return null;

        return options.find(
            (country) => String(country?.countryId) === String(value)
        ) || null;
    }, [options, value]);

    const filteredCountries = useMemo(() => {
        const search = query.trim().toLowerCase();

        if (!search) return options;

        return options.filter((country) => {
            const countryName = String(country?.countryName || '').toLowerCase();
            const code = String(country?.code || '').toLowerCase();
            const isoCode = String(country?.isoCode || '').toLowerCase();
            const dialCode = String(country?.dialCode || '').toLowerCase();
            const countryId = String(country?.countryId || '').toLowerCase();

            return (
                countryName.includes(search) ||
                code.includes(search) ||
                isoCode.includes(search) ||
                dialCode.includes(search) ||
                countryId.includes(search)
            );
        });
    }, [options, query]);

    const handleOpen = () => {
        if (loading) return;
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setQuery('');
    };

    const handleSelect = (country) => {
        onChange?.(String(country.countryId));
        setQuery('');
        setOpen(false);
    };

    return (
        <div className="position-relative">
            <Form.Label
                htmlFor={`${idPrefix}-dropdown`}
                className="small text-muted fw-bold"
            >
                {label}
            </Form.Label>

            <Dropdown show={open} onToggle={(nextShow) => {
                if (loading) return;
                if (nextShow) handleOpen();
                else handleClose();
            }}>
                <Dropdown.Toggle
                    id={`${idPrefix}-dropdown`}
                    variant="light"
                    disabled={loading}
                    className="w-100 text-start d-flex align-items-center justify-content-between border"
                >
                    <span className={selectedCountry ? 'text-dark' : 'text-muted'}>
                        {loading
                            ? loadingText
                            : selectedCountry?.countryName || placeholder}
                    </span>
                </Dropdown.Toggle>

                <Dropdown.Menu
                    className="w-100 p-2 shadow-sm"
                    style={{ minWidth: '100%', maxHeight: 340 }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="mb-2">
                        <Form.Control
                            autoFocus
                            type="search"
                            placeholder="Search country, code..."
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                        />
                    </div>

                    <div style={{ maxHeight: 270, overflowY: 'auto' }}>
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => {
                                const countryValue = String(country.countryId);
                                const isSelected = countryValue === String(value);

                                return (
                                    <Dropdown.Item
                                        key={`${idPrefix}-${countryValue}`}
                                        active={isSelected}
                                        onClick={() => handleSelect(country)}
                                        className="rounded-2"
                                    >
                                        <div className="d-flex justify-content-between align-items-center gap-2">
                                            <span className="text-truncate">
                                                {country.countryName}
                                            </span>

                                            <small className="text-muted flex-shrink-0">
                                                {country.code || country.isoCode || ''}
                                            </small>
                                        </div>
                                    </Dropdown.Item>
                                );
                            })
                        ) : (
                            <div className="text-muted small text-center py-3">
                                No countries found
                            </div>
                        )}
                    </div>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}

const today = new Date().toISOString().split('T')[0];



function CalendarIcon() {

    return (

        <svg

            viewBox="0 0 24 24"

            fill="none"

            stroke="currentColor"

            strokeWidth="1.8"

        >

            <rect x="3" y="5" width="18" height="16" rx="2" />

            <path d="M16 3v4M8 3v4M3 10h18" />

        </svg>

    );

}



function UsersIcon() {

    return (

        <svg

            viewBox="0 0 24 24"

            fill="none"

            stroke="currentColor"

            strokeWidth="1.8"

        >

            <circle cx="9" cy="8" r="3" />

            <path d="M3 20a6 6 0 0 1 12 0" />

            <path d="M16 5a3 3 0 0 1 0 6M18 20a5 5 0 0 0-2.2-4.15" />

        </svg>

    );

}



function MapPinIcon() {

    return (

        <svg

            viewBox="0 0 24 24"

            fill="none"

            stroke="currentColor"

            strokeWidth="1.8"

        >

            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

            <circle cx="12" cy="10" r="2.5" />

        </svg>

    );

}



function SearchIcon() {

    return (

        <svg

            viewBox="0 0 24 24"

            fill="none"

            stroke="currentColor"

            strokeWidth="2"

        >

            <circle cx="11" cy="11" r="7" />

            <path d="m20 20-4-4" />

        </svg>

    );

}



function FieldIcon({ children }) {

    return <span className="tj-field-icon">{children}</span>;

}



export default function HotelSearchForm({

    form,

    loading,

    hidsLoading,



    selectedCity,

    citySuggestions,

    cityLoading,

    showCitySuggestions,



    guestMenuOpen,

    setGuestMenuOpen,



    showAdvanced,

    setShowAdvanced,



    guestSummary,



    updateForm,

    handleDestinationChange,

    handleCitySelect,



    getCityName,

    getCityCountry,

    getCityRegionId,



    updateRoomCount,

    updateChildAge,

    addRoom,

    removeRoom,



    onSubmit,

    onShowCitySuggestions,

    onHideCitySuggestions,



    nationalities = [],

    nationalitiesLoading = false,

    residenceCountry = '',

    setResidenceCountry,

}) {

    return (

        <Card className="shadow-lg border-0 rounded-4 p-3 p-md-4">

            {/* HEADER */}

            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">

                <div>

                    <span className="tj-eyebrow-text">

                        Search hotels

                    </span>



                    <div className="fw-bold fs-5">

                        Where are you going?

                    </div>

                </div>



                <Badge

                    bg="success-subtle"

                    text="success"

                    className="px-3 py-2 rounded-pill fw-bold"

                >

                    ● Secure booking

                </Badge>

            </div>



            <Form onSubmit={onSubmit}>

                <Row className="g-2 align-items-stretch">



                    {/* DESTINATION */}

                    <Col xs={12} lg={4}>

                        <div className="tj-field h-100 d-flex align-items-center">

                            <FieldIcon>

                                <MapPinIcon />

                            </FieldIcon>



                            <div className="flex-grow-1 min-w-0 tj-destination-wrapper">

                                <Form.Label className="tj-field-label">

                                    Destination

                                </Form.Label>



                                <Form.Control

                                    type="text"

                                    className="tj-field-input w-100"

                                    placeholder="City, hotel or destination"

                                    value={form.destination}

                                    autoComplete="off"

                                    onChange={(e) =>

                                        handleDestinationChange(

                                            e.target.value

                                        )

                                    }

                                    onFocus={onShowCitySuggestions}

                                    onBlur={onHideCitySuggestions}

                                />



                                {cityLoading && (

                                    <div className="tj-city-loading">

                                        <Spinner

                                            animation="border"

                                            size="sm"

                                        />

                                    </div>

                                )}



                                {hidsLoading && selectedCity && (

                                    <div className="tj-hids-status d-flex align-items-center gap-2">

                                        <Spinner

                                            animation="border"

                                            size="sm"

                                        />



                                        <span>

                                            Loading hotels...

                                        </span>

                                    </div>

                                )}



                                {!cityLoading &&

                                    !hidsLoading &&

                                    showCitySuggestions &&

                                    citySuggestions.length > 0 && (

                                        <div className="tj-city-suggestions">

                                            {citySuggestions.map(

                                                (city, index) => {

                                                    const cityName =

                                                        getCityName(city);



                                                    const countryName =

                                                        getCityCountry(city);



                                                    const regionId =

                                                        getCityRegionId(city);



                                                    return (

                                                        <button

                                                            type="button"

                                                            key={

                                                                regionId ||

                                                                `${cityName}-${index}`

                                                            }

                                                            className="tj-city-suggestion"

                                                            onMouseDown={(e) =>

                                                                e.preventDefault()

                                                            }

                                                            onClick={() =>

                                                                handleCitySelect(

                                                                    city

                                                                )

                                                            }

                                                        >

                                                            <span className="tj-city-suggestion-icon">

                                                                <MapPinIcon />

                                                            </span>



                                                            <span className="tj-city-suggestion-content">

                                                                <strong>

                                                                    {cityName}

                                                                </strong>



                                                                <small>

                                                                    {countryName ||

                                                                        'TripJack Destination'}

                                                                </small>

                                                            </span>

                                                        </button>

                                                    );

                                                }

                                            )}

                                        </div>

                                    )}

                            </div>

                        </div>

                    </Col>



                    {/* CHECK IN */}

                    <Col xs={6} lg={2}>

                        <div className="tj-field h-100 d-flex align-items-center">

                            <FieldIcon>

                                <CalendarIcon />

                            </FieldIcon>



                            <div className="flex-grow-1 min-w-0">

                                <Form.Label className="tj-field-label text-nowrap">

                                    Check-in

                                </Form.Label>



                                <Form.Control

                                    type="date"

                                    min={today}

                                    value={form.checkIn}

                                    onChange={(e) =>

                                        updateForm(

                                            'checkIn',

                                            e.target.value

                                        )

                                    }

                                    required

                                    className="tj-field-input w-100"

                                    style={{

                                        minWidth: 0,

                                        fontSize:

                                            'clamp(11px, 2.8vw, 14px)',

                                    }}

                                />

                            </div>

                        </div>

                    </Col>



                    {/* CHECK OUT */}

                    <Col xs={6} lg={2}>

                        <div className="tj-field h-100 d-flex align-items-center">

                            <FieldIcon>

                                <CalendarIcon />

                            </FieldIcon>



                            <div className="flex-grow-1 min-w-0">

                                <Form.Label className="tj-field-label text-nowrap">

                                    Check-out

                                </Form.Label>



                                <Form.Control

                                    type="date"

                                    min={form.checkIn || today}

                                    value={form.checkOut}

                                    onChange={(e) =>

                                        updateForm(

                                            'checkOut',

                                            e.target.value

                                        )

                                    }

                                    required

                                    className="tj-field-input w-100"

                                    style={{

                                        minWidth: 0,

                                        fontSize:

                                            'clamp(11px, 2.8vw, 14px)',

                                    }}

                                />

                            </div>

                        </div>

                    </Col>



                    {/* GUESTS */}

                    <Col xs={12} lg={2}>

                        <Dropdown

                            show={guestMenuOpen}

                            onToggle={setGuestMenuOpen}

                            autoClose="outside"

                            className="w-100 h-100"

                        >

                            <Dropdown.Toggle

                                as="div"

                                className="tj-field tj-guest-toggle h-100 w-100 d-flex align-items-center"

                            >

                                <FieldIcon>

                                    <UsersIcon />

                                </FieldIcon>



                                <div className="flex-grow-1 overflow-hidden min-w-0">

                                    <Form.Label className="tj-field-label mb-0">

                                        Guests & rooms

                                    </Form.Label>



                                    <div className="fw-bold small text-truncate">

                                        {guestSummary}

                                    </div>

                                </div>

                            </Dropdown.Toggle>



                            <Dropdown.Menu

                                className="p-3 shadow-lg border-0 rounded-4 tj-guest-menu"

                                style={{

                                    width:

                                        'min(360px, calc(100vw - 24px))',

                                    maxWidth:

                                        'calc(100vw - 24px)',

                                }}

                            >

                                {form.rooms.map((room, index) => (

                                    <div

                                        key={index}

                                        className="pb-3 mb-3 border-bottom"

                                    >

                                        <div className="d-flex justify-content-between align-items-center mb-2">

                                            <strong className="small">

                                                Room {index + 1}

                                            </strong>



                                            {form.rooms.length > 1 && (

                                                <Button

                                                    type="button"

                                                    variant="link"

                                                    size="sm"

                                                    className="text-danger p-0 text-decoration-none"

                                                    onClick={() =>

                                                        removeRoom(index)

                                                    }

                                                >

                                                    Remove

                                                </Button>

                                            )}

                                        </div>



                                        {/* ADULTS */}

                                        <div className="d-flex justify-content-between align-items-center mb-2">

                                            <span className="small">

                                                Adults

                                            </span>



                                            <div className="d-flex align-items-center gap-2">

                                                <Button

                                                    type="button"

                                                    variant="outline-secondary"

                                                    className="tj-counter-btn"

                                                    onClick={() =>

                                                        updateRoomCount(

                                                            index,

                                                            'adults',

                                                            -1

                                                        )

                                                    }

                                                >

                                                    −

                                                </Button>



                                                <strong>

                                                    {room.adults}

                                                </strong>



                                                <Button

                                                    type="button"

                                                    variant="outline-secondary"

                                                    className="tj-counter-btn"

                                                    onClick={() =>

                                                        updateRoomCount(

                                                            index,

                                                            'adults',

                                                            1

                                                        )

                                                    }

                                                >

                                                    +

                                                </Button>

                                            </div>

                                        </div>



                                        {/* CHILDREN */}

                                        <div className="d-flex justify-content-between align-items-center">

                                            <span className="small">

                                                Children

                                            </span>



                                            <div className="d-flex align-items-center gap-2">

                                                <Button

                                                    type="button"

                                                    variant="outline-secondary"

                                                    className="tj-counter-btn"

                                                    onClick={() =>

                                                        updateRoomCount(

                                                            index,

                                                            'children',

                                                            -1

                                                        )

                                                    }

                                                >

                                                    −

                                                </Button>



                                                <strong>

                                                    {room.children}

                                                </strong>



                                                <Button

                                                    type="button"

                                                    variant="outline-secondary"

                                                    className="tj-counter-btn"

                                                    onClick={() =>

                                                        updateRoomCount(

                                                            index,

                                                            'children',

                                                            1

                                                        )

                                                    }

                                                >

                                                    +

                                                </Button>

                                            </div>

                                        </div>



                                        {/* CHILD AGES */}

                                        {room.children > 0 && (

                                            <div className="mt-2">

                                                <Form.Label className="small text-muted mb-1">

                                                    Child ages

                                                </Form.Label>



                                                <div className="d-flex flex-wrap gap-2">

                                                    {room.childAges.map(

                                                        (

                                                            age,

                                                            childIndex

                                                        ) => (

                                                            <Form.Select

                                                                key={

                                                                    childIndex

                                                                }

                                                                size="sm"

                                                                value={

                                                                    age

                                                                }

                                                                onChange={(

                                                                    e

                                                                ) =>

                                                                    updateChildAge(

                                                                        index,

                                                                        childIndex,

                                                                        e

                                                                            .target

                                                                            .value

                                                                    )

                                                                }

                                                                style={{

                                                                    width: 68,

                                                                }}

                                                            >

                                                                {Array.from(

                                                                    {

                                                                        length: 18,

                                                                    }

                                                                ).map(

                                                                    (

                                                                        _,

                                                                        ageIndex

                                                                    ) => (

                                                                        <option

                                                                            key={

                                                                                ageIndex

                                                                            }

                                                                            value={

                                                                                ageIndex

                                                                            }

                                                                        >

                                                                            {

                                                                                ageIndex

                                                                            }

                                                                        </option>

                                                                    )

                                                                )}

                                                            </Form.Select>

                                                        )

                                                    )}

                                                </div>

                                            </div>

                                        )}

                                    </div>

                                ))}



                                <Button

                                    type="button"

                                    variant="link"

                                    className="p-0 fw-bold text-decoration-none tj-teal-text"

                                    onClick={addRoom}

                                >

                                    + Add another room

                                </Button>



                                <div className="d-grid mt-3">

                                    <Button

                                        type="button"

                                        className="tj-btn-primary fw-bold border-0"

                                        size="sm"

                                        onClick={() =>

                                            setGuestMenuOpen(false)

                                        }

                                    >

                                        Done

                                    </Button>

                                </div>

                            </Dropdown.Menu>

                        </Dropdown>

                    </Col>



                    {/* SEARCH */}

                    <Col xs={12} lg={2} className="d-grid">

                        <Button

                            type="submit"

                            disabled={loading || hidsLoading}

                            className="tj-btn-primary fw-bold border-0 h-100 w-100 d-flex align-items-center justify-content-center gap-2"

                        >

                            {loading || hidsLoading ? (

                                <Spinner

                                    animation="border"

                                    size="sm"

                                />

                            ) : (

                                <span className="tj-inline-icon">

                                    <SearchIcon />

                                </span>

                            )}



                            {hidsLoading

                                ? 'Loading hotels...'

                                : loading

                                    ? 'Searching...'

                                    : 'Search'}

                        </Button>

                    </Col>

                </Row>



                {/* ADVANCED */}

                <div className="mt-3">

                    <Button

                        type="button"

                        variant="link"

                        size="sm"

                        className="p-0 text-decoration-none tj-teal-text fw-bold"

                        onClick={() =>

                            setShowAdvanced((value) => !value)

                        }

                    >

                        {showAdvanced ? '− Hide' : '+ Show'} advanced

                        options

                    </Button>



                    <Collapse in={showAdvanced}>

                        <div>

                            <Row className="g-3 mt-1">

                                <Col xs={6} md={3}>

                                    <Form.Label className="small text-muted fw-bold">

                                        Currency

                                    </Form.Label>



                                    <Form.Select

                                        value={form.currency}

                                        onChange={(e) =>

                                            updateForm(

                                                'currency',

                                                e.target.value

                                            )

                                        }

                                    >

                                        <option value="INR">

                                            INR

                                        </option>



                                        <option value="USD">

                                            USD

                                        </option>

                                    </Form.Select>

                                </Col>



                                <Col xs={12} md={3}>
                                    <SearchableCountryDropdown
                                        idPrefix="nationality"
                                        label="Nationality"
                                        value={form.nationality || ''}
                                        options={nationalities}
                                        loading={nationalitiesLoading}
                                        placeholder="Select nationality"
                                        loadingText="Loading nationalities..."
                                        onChange={(value) =>
                                            updateForm('nationality', value)
                                        }
                                    />
                                </Col>



                                <Col xs={12} md={3}>
                                    <SearchableCountryDropdown
                                        idPrefix="residence-country"
                                        label="Country of Residence"
                                        value={residenceCountry || ''}
                                        options={nationalities}
                                        loading={nationalitiesLoading}
                                        placeholder="Select country"
                                        loadingText="Loading countries..."
                                        onChange={(value) =>
                                            setResidenceCountry(value)
                                        }
                                    />
                                </Col>



                                {selectedCity && (

                                    <Col xs={12} md={6}>

                                        <Form.Label className="small text-muted fw-bold">

                                            Selected destination

                                        </Form.Label>



                                        <div className="form-control bg-light d-flex flex-wrap justify-content-between gap-2">

                                            <strong>

                                                {getCityName(

                                                    selectedCity

                                                )}

                                            </strong>



                                            <span className="text-muted small">

                                                Region:{' '}

                                                {getCityRegionId(

                                                    selectedCity

                                                )}

                                            </span>

                                        </div>

                                    </Col>

                                )}

                            </Row>

                        </div>

                    </Collapse>

                </div>



                {/* TRUST */}

                <div className="d-flex flex-wrap gap-2 gap-md-4 mt-3 small fw-bold text-muted">

                    <span>

                        ✓ Free cancellation on selected stays

                    </span>



                    <span>

                        ✓ Best available rates

                    </span>



                    <span>

                        ✓ Trusted travel partners

                    </span>

                </div>

            </Form>

        </Card>

    );

}