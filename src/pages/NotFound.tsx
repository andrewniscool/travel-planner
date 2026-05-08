import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary-50 text-primary-500 mb-6">
        <Compass className="w-10 h-10" />
      </div>
      <h1 className="text-6xl font-bold text-neutral-900 mb-2">404</h1>
      <p className="text-lg text-neutral-600 mb-6">Page not found</p>
      <p className="text-sm text-neutral-400 max-w-md mb-8">
        The page you are looking for does not exist or has been moved. Let&apos;s get you back on track.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" size="lg">
          <Compass className="w-4 h-4 mr-2" />
          Go back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
