import React, { useContext, useEffect, useState } from 'react';
import HeroImage from '../assets/bg-hero.png';
import FoodImage from '../assets/food-hero.png';
import { FaEnvelope } from "react-icons/fa";
import { IconContext } from "react-icons";
import { CartContext } from '../components/CartContext';
import ExploreProducts from '../components/ExploreProducts';
import ProductCard from '../components/ProductCard';

import {
  beveragesProducts,
  bbqProducts,
  produceProducts,
  snacksProducts,
  dairyProducts,
  allNewProducts,
} from '../components/Stock';

function RootLayout() {
  const { addToCart } = useContext(CartContext);
  const [recentlyAddedItems, setRecentlyAddedItems] = useState([]);

  const topSoldItems = [
    beveragesProducts[0],
    bbqProducts[0],
    produceProducts[0],
  ];

  const topRatedItems = [
    snacksProducts[0],
    dairyProducts[0],
    bbqProducts[1],
  ];

  const trendingItems = [
    beveragesProducts[1],
    produceProducts[1],
    snacksProducts[1],
  ];

  // Function to randomly select 3 items from the new products
  const getRandomRecentlyAddedItems = () => {
    const shuffled = allNewProducts.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  useEffect(() => {
    setRecentlyAddedItems(getRandomRecentlyAddedItems());
  }, []);

  const promoItems = [
    {
      name: 'BBQ Essentials Sale',
      image: bbqProducts[0].image,
      description: 'Get your BBQ favorites at discounted prices! Perfect for summer grilling.',
      price: bbqProducts[0].price,
      identifiers: ['BBQ', 'Summer'],
    },
    {
      name: 'Cool Drinks Offer',
      image: beveragesProducts[1].image,
      description: 'Stay refreshed with our selection of summer beverages, now at special prices.',
      price: beveragesProducts[1].price,
      identifiers: ['Beverages', 'Summer'],
    },
    {
      name: 'Fresh Produce Picks',
      image: produceProducts[0].image,
      description: 'Enjoy the freshest seasonal produce, ideal for summer salads and snacks.',
      price: produceProducts[0].price,
      identifiers: ['Produce', 'Summer'],
    }
  ];

  return (
    <>
      <main className='' style={{ backgroundImage: `url(${HeroImage})`, backgroundSize: 'contain' }}>
        <div className="relative hero min-h-96" style={{ backgroundImage: `url(${HeroImage})`, backgroundSize: 'cover' }}>
          <div className="absolute inset-0 bg-green-400 opacity-80"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-8 py-8">
            <div className="text-white max-w-md">
              <h1 className="text-4xl font-bold mb-4">Welcome to Foodie</h1>
              <p className="text-lg mb-6">Your one-stop shop for all your food needs</p>
              <div className="flex items-center space-x-2">
                <input 
                  type="email" 
                  placeholder="Subscribe to our newsletter..." 
                  className="input input-bordered bg-white text-black w-full md:w-800 rounded-none px-4 py-2"
                />
                <button className="btn bg-white text-[#30C976] rounded-none px-4 py-2">
                  <IconContext.Provider value={{ color: "#30C976" }}>
                    <FaEnvelope size={24} />
                  </IconContext.Provider>
                </button>
              </div>
            </div>
            <img src={FoodImage} alt="Food" className="w-48 h-48 object-cover rounded-full shadow-lg ml-8 mt-8 lg:mt-0" />
          </div>
        </div>

        <ExploreProducts />

        {/* Top Sold Items */}
        <div className="mt-20 p-8 bg-green-200">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Top Sold Items</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {topSoldItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Top Rated Items */}
        <div className="mt-20 p-8 bg-green-200">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Top Rated Items</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {topRatedItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Trending Items */}
        <div className="mt-20 p-8 bg-green-200">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Trending Items</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {trendingItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Recently Added */}
        <div className="mt-20 p-8 bg-green-200">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Recently Added</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recentlyAddedItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Promotional Section */}
        <div className="mt-20">
          <div className="relative h-80 bg-gray-200 flex items-center justify-center mb-10">
            <img
              src="https://www.napoleon.com/sites/default/files/images/2023-05/grillsBlog-feature-Summer2023.jpg"
              alt="Summer Savings Banner"
              className="object-cover h-full w-full"
            />
            <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold bg-black bg-opacity-50 ">
              <span>Enjoy Summer with your Family & Friends with Promotions all Season Long</span>
            </div>
          </div>

          <div className="mt-20 p-8 bg-yellow-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {promoItems.map(product => (
                <ProductCard key={product.name} product={product} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default RootLayout;
