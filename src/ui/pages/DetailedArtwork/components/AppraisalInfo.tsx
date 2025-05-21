import React from "react";
import AuctionRef from "./AuctionRef";

const auctions = [
  {
    id: 1,
    title: 'Salcedo Auctions',
    href: '#',
    size: 'Size: 227 x 314 cm',
    price: 'PHP 2,600,000 = 456.74 sq/in',
    description:
      'Illo sint voluptas. Error voluptates culpa eligendi. Hic vel totam vitae illo. Non aliquid explicabo necessitatibus unde.',
    date: ' 2021',
    datetime: '2020-03-16',
    category: { title: 'Marketing', href: '#' },
    author: {
      name: 'Michael Foster',
      role: 'Co-Founder / CTO',
      href: '#',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
  {
    id: 2,
    title: 'Christies',
    href: '#',
    size: 'Size: 227 x 314 cm',
    price: 'PHP 2,600,000 = 456.74 sq/in',
    description:
      'Illo sint voluptas. Error voluptates culpa eligendi. Hic vel totam vitae illo. Non aliquid explicabo necessitatibus unde.',
    date: ' 2014',
    datetime: '2020-03-16',
    category: { title: 'Marketing', href: '#' },
    author: {
      name: 'Michael Foster',
      role: 'Co-Founder / CTO',
      href: '#',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
  {
    id: 3,
    title: 'Larasati Auctions',
    href: '#',
    size: 'Size: 227 x 314 cm',
    price: 'PHP 2,600,000 = 456.74 sq/in',
    description:
      'Illo sint voluptas. Error voluptates culpa eligendi. Hic vel totam vitae illo. Non aliquid explicabo necessitatibus unde.',
    date: ' 2014',
    datetime: '2020-03-16',
    category: { title: 'Marketing', href: '#' },
    author: {
      name: 'Michael Foster',
      role: 'Co-Founder / CTO',
      href: '#',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
  {
    id: 4,
    title: 'Leon Gallery',
    href: '#',
    size: 'Size: 227 x 314 cm',
    price: 'PHP 2,600,000 = 456.74 sq/in',
    description:
      'Illo sint voluptas. Error voluptates culpa eligendi. Hic vel totam vitae illo. Non aliquid explicabo necessitatibus unde.',
    date: ' 2021',
    datetime: '2020-03-16',
    category: { title: 'Marketing', href: '#' },
    author: {
      name: 'Michael Foster',
      role: 'Co-Founder / CTO',
      href: '#',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  },
];

export default function AppraisalInfo() {
  return (
    <div className="container mx-auto px-6 lg:px-8 text-base-content">
        <div className="max-w-2xl mx-auto lg:mx-0">
          <h3 className="text-2xl font-bold text-primary">Appraisals</h3>
          <p className="">National Artist for Visual Arts(2009).</p>
          <p className="">(June 6, 1936 - February 2, 2011)</p>
          <p className="">This artwork from manilenos series</p>
        </div>
        {auctions.length && (
          <AuctionRef auctions={auctions} />
        )}
        
    </div>
  );
}
