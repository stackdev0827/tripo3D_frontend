import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Eye, RotateCw, ZoomIn, Upload } from 'lucide-react';
import type { Project } from '../types';
import axios from "axios";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

// Add this new component for the 3D model
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={3} position={[0, 0, 0]} />;
}

// const apiKey = "tcli_7de49c7d33dc4e1fb9aff135c3855fa4";
// const corsProxy = 'https://cors-anywhere.herokuapp.com/';
// const url = `${corsProxy}https://api.tripo3d.ai/v2/openapi/upload`;

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
}

export function ProjectView({ project, onBack }: ProjectViewProps) {
  const [progress, setProgress] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  // const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [modelGenerated, setModelGenerated] = useState(false);
  const [images, setImages] = useState<string[]>(project.thumbnailUrl ? [project.thumbnailUrl] : []);
  const [uploading, setUploading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  // const exportFormats = [
  //   { name: 'GLB', description: 'Binary GL Transmission Format', size: '2.4 MB' },
  //   { name: 'FBX', description: 'Filmbox 3D Format', size: '3.1 MB' },
  //   { name: 'OBJ', description: 'Wavefront 3D Object Format', size: '1.8 MB' },
  // ];

  useEffect(() => {
    if (project.status === 'processing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 2;
          if (newProgress >= 100) {
            setModelGenerated(true);
            clearInterval(interval);
            return newProgress;
          }
          return newProgress;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [project.status]);

  // const handleExport = (format: typeof exportFormats[0]) => {
  //   console.log(`Downloading ${format.name} format`);
  //   setShowExportDropdown(false);
  // };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await axios.post('https://caa1-51-75-188-0.ngrok-free.app/api/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.data) {
        setImages(prev => [...prev, URL.createObjectURL(file)]);
        if (response.data.tripo3dResponse?.output?.pbr_model) {
          console.log(response.data.tripo3dResponse.output.pbr_model);
          setModelUrl(response.data.tripo3dResponse.output.pbr_model);
          setModelGenerated(true);
        }
        console.log('Upload successful:', response.data);
      }
    } catch (error) {
      console.error('Error in file upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          <p className="mt-1 text-sm text-gray-500">{project.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Images */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900">Source Images</h3>
            <span className="text-sm text-gray-500">{images.length} images</span>
          </div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {images[activeImage] ? (
              <img
                src={images[activeImage]}
                alt="Source"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-gray-400">No images uploaded</div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  activeImage === idx ? 'border-indigo-600' : 'border-transparent'
                }`}
              >
                <img src={img} alt={`Source ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Upload Button */}
          <div className="mt-4">
            <label
              htmlFor="image-upload"
              className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md cursor-pointer hover:bg-indigo-700"
            >
              <Upload className="w-5 h-5 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900">3D Model</h3>
            {modelGenerated && modelUrl && (
              <a 
                href={modelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download Model
              </a>
            )}
          </div>
          
          <div className="h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            {modelUrl ? (
              <Canvas
                camera={{ position: [2, 2, 5], fov: 50 }} // Adjusted camera position for a better view
                style={{ width: '100%', height: '100%' }}
              >
                {/* Add balanced lighting */}
                <ambientLight intensity={0.8} /> {/* General light to brighten the scene */}
                <directionalLight position={[5, 5, 5]} intensity={1} /> {/* A directional light to create shadows */}
                <pointLight position={[-5, -5, -5]} intensity={0.5} /> {/* Additional light for softer illumination */}
                {/* Render the model */}
                <Model url={modelUrl} />
                {/* Controls for interaction */}
                <OrbitControls
                  enableZoom={true}
                  enablePan={true}
                  enableRotate={true}
                />
              </Canvas>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-500">
                  {uploading ? 'Processing...' : 'No 3D model available'}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {/* {modelUrl && (
            <div className="flex justify-center space-x-4">
              <button 
                className="p-2 hover:bg-gray-100 rounded-full" 
                title="Rotate"
              >
                <RotateCw className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                className="p-2 hover:bg-gray-100 rounded-full" 
                title="Zoom"
              >
                <ZoomIn className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                className="p-2 hover:bg-gray-100 rounded-full" 
                title="View Mode"
              >
                <Eye className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}