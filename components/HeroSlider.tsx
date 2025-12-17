'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const slides = [
  {
    title: 'All Your Home Services in One Place',
    subtitle: 'From maids to plumbers, electricians to bathroom cleaning – book trusted professionals with ease.',
    buttonText: null,
    image: '/banners/bathroom-cleaning.png', // Replace with your image path
  },
  {
    title: 'Maid Services, Reinvented',
    subtitle: 'Safe, fast and on your terms.',
    buttonText: 'Book Now',
    buttonLink: '/book/maids',
    image: '/banners/maid-service.png',
  },
  {
    title: 'Bathroom Cleaning Service',
    subtitle: 'Hygienic deep cleaning for your bathrooms.',
    buttonText: 'Coming Soon',
    buttonLink: '#',
    image: '/banners/bathroom-cleaning.png',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(interval);
  }, []);

  const slide = slides[current];

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      {/* Background Image */}
      <Image
        src={slide.image}
        alt={slide.title}
        fill
        priority
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      {/* Text Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-start px-8 md:px-16 text-white max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{slide.title}</h1>
        <p className="text-lg md:text-xl mb-6">{slide.subtitle}</p>
        {slide.buttonText && (
          <Link
            href={slide.buttonLink || '#'}
            className={`px-6 py-3 rounded-lg font-semibold ${
              slide.buttonText === 'Book Now'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-400 cursor-not-allowed text-white'
            }`}
          >
            {slide.buttonText}
          </Link>
        )}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full ${
              index === current ? 'bg-white' : 'bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}