
import React from 'react';
import { GroundingSource } from '../types';

interface FooterProps {
    sources: GroundingSource[];
}

const Footer: React.FC<FooterProps> = ({ sources }) => {
    if (sources.length === 0) {
        return null;
    }

    return (
        <footer className="bg-brand-gray border-t border-gray-700 px-4 py-2 text-xs text-gray-400">
            <div className="max-w-4xl mx-auto">
                <h3 className="font-semibold mb-1">Sources:</h3>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {sources.map((source, index) => (
                        <li key={index}>
                            <a 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="hover:text-blue-400 hover:underline transition-colors"
                            >
                                {index + 1}. {source.title || new URL(source.uri).hostname}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </footer>
    );
};

export default Footer;
