import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Clock, Mail } from 'lucide-react';

const ComingSoon = ({ title = "Coming Soon", description = "We're working hard to bring you something amazing. Stay tuned!" }) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              {description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/contact">
                <Mail className="h-4 w-4 mr-2" />
                Contact Us
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Want to be notified when this feature is available? 
              <Link to="/contact" className="text-primary hover:underline ml-1">
                Get in touch with us
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
