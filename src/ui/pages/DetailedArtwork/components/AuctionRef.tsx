import React from "react";
import { AuctionProps } from "./types";

export default function AuctionRef({auctions}: AuctionProps) {
  return (
    <div className="grid grid-cols-1 gap-8 pt-5 sm:grid-cols-2 lg:grid-cols-3">
        {auctions.map((auction) => (
        <div key={auction.id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h3 className="text-lg font-semibold hover:text-primary">
                    {auction.title}
                </h3>
                <time className="">{auction.date}</time>
                <p className="text-sm  mt-2">{auction.size}</p>
                <p className="text-sm  mt-2">{auction.price}</p>
                <p className="text-sm  mt-2">{auction.description}</p>
            </div>
        </div>
        ))}
    </div>
  );
}
