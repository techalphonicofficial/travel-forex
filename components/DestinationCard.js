'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getDestinationHref } from '@/utils/destinationLinks';

export default function DestinationCard({ destination, className = '' }) {
  return (
    <Link href={getDestinationHref(destination)} className={`destination-card ${className}`}>
      <Image
        src={destination.image}
        alt={destination.name}
        fill
        sizes="280px"
        style={{ objectFit: 'cover' }}
        loading="lazy"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH7AQsBAsNCwsKCwsNCxAQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAeAEADASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwAB/9k="
      />
      <div className="destination-overlay" />
      <div className="destination-card-body">
        <div className="destination-name">{destination.name}</div>
        <div className="destination-country">{destination.country}</div>
        <div className="destination-count">{destination.tours} tours available</div>
      </div>
    </Link>
  );
}
