import { Product } from './ProductList';

interface ProductItemProps {
  product: Product;
  onBuyClick: () => void;
}

const ProductItem = ({ product, onBuyClick }: ProductItemProps) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg mr-[10px] mb-[20px] transition-all hover:shadow-2xl hover:border-blue-500/30 group w-[200px] flex-shrink-0">
      <div className="relative rounded-[20px] w-[200px] h-[200px] overflow-hidden">
        <img
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute bottom-3 left-3 bg-gray-900/80 text-gray-300 px-3 py-1 rounded-full text-xs z-10 backdrop-blur-sm border border-gray-700/50">
          #{product.id.split('-')[1]}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-gray-900/95 to-gray-900/80 backdrop-blur-sm">
          <h3 className="text-base font-bold text-white truncate">{product.name}</h3>
          <p className="text-gray-300 text-xs mt-1 line-clamp-2 opacity-80">
            {product.description}
          </p>
        </div>
      </div>

	    <div className="p-4">
		    <h3 className="text-base mb-[5px] mt-[5px] text-center text-black truncate group-hover:text-blue-600 transition-colors mb-2 block">{product.name}</h3>
		    <div className="bg-blue-500/90 mb-[5px] pl-[10px] text-center text-white px-3 py-1 rounded-full text-sm font-semibold z-10 shadow-lg backdrop-blur-sm">
			    Price: ${product.price.toFixed(2)}
		    </div>
		    <button
			    onClick={onBuyClick}
			    className="w-full font-bold bg-transparent text-blue-600 hover:bg-blue-500/10 font-medium py-2 px-4 rounded-lg transition-all duration-200  buy-button"
		    >
			    Buy
		    </button>
	    </div>
    </div>
  );
};

export default ProductItem;
