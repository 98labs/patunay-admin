export interface ArtworkImageModalProps {
    images: string[]; // Array of image URLs
    title: string;
  }

interface AuctionRefProps {
  id: number;
  title: string;
  size: string;
  price: string;
  href: string;
  description: string;
  date: string;
  datetime: string;
  category: { title: string; href: string };
  author: { name: string; role: string; href: string; imageUrl: string };
}
export interface AuctionProps {
  auctions: AuctionRefProps[];
}
