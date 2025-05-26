import ProductList from './components/ProductList';

function App() {
  return (
    <div className="bg-white text-black">
      <div className="container mx-auto px-4 py-8 pb-32 overflow-y-auto" style={{ height: 'calc(100vh - 72px)' }}>
        <ProductList />
      </div>

      <footer className="bg-gray-100 border-t border-gray-200 py-6 w-full fixed bottom-0 left-0 z-10">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2025 Sui Easy buy. All rights reserved.</p>
          <p className="mt-2">Powered by Sui</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
