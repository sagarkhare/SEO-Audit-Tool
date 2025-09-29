import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">About Us</h1>
            <p className="text-xl text-muted-foreground">
              Learn more about our mission to make SEO accessible to everyone.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;