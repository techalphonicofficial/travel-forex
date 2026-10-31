'use client';

import { descriptionSections, policySections } from './hotelUtils';

/* Expandable block: title row, content shown on click */
export function Collapse({ title, hint, defaultOpen = false, children }) {
    return (
        <details className="hb-collapse" open={defaultOpen}>
            <summary>
                <span>{title}</span>
                {hint && <small>{hint}</small>}
                <i aria-hidden="true" />
            </summary>
            <div className="hb-collapse-body">{children}</div>
        </details>
    );
}

export function Points({ points }) {
    return (
        <ul className="hb-points">
            {points.map((point, index) => <li key={index}>{point}</li>)}
        </ul>
    );
}

/* Supplier policies (check-in instructions, know before you go, fees) */
export function PolicySections({ hotel, defaultOpen = false }) {
    const sections = policySections(hotel);
    if (!sections.length) return null;
    return sections.map((section) => (
        <Collapse key={section.key} title={section.title} defaultOpen={defaultOpen}>
            {section.groups.map((group, index) => (
                <div key={index} className="hb-points-group">
                    {group.label && <h5>{group.label}</h5>}
                    <Points points={group.points} />
                </div>
            ))}
        </Collapse>
    ));
}

/* "About the property": highlights first, the rest collapsed */
export function AboutSections({ hotel }) {
    const sections = descriptionSections(hotel);
    if (!sections.length) return null;
    const [first, ...rest] = sections;
    return (
        <>
            <div className="hb-about-lead">
                <h4>{first.title}</h4>
                <Points points={first.points} />
            </div>
            {rest.map((section) => (
                <Collapse key={section.key} title={section.title}>
                    <Points points={section.points} />
                </Collapse>
            ))}
        </>
    );
}
