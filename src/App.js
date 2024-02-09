import React, { useState, useEffect } from 'react';
import Canvas from './Canvas';
import { Switch } from '@headlessui/react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

function App() {
  const [enabled, setEnabled] = useState(false)
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchImagesFromS3();
  }, []);

const s3Client = new S3Client({
    region: "us-east-1", // Update with your bucket's region
    credentials: {
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    },
  });

  const fetchImagesFromS3 = async () => {
    try {
      const listParams = {
        Bucket: "lgdimagebucket", // Update with your bucket's name
        MaxKeys: 30 // Fetch first 30 images
      };

      const data = await s3Client.send(new ListObjectsV2Command(listParams));
      const objectKeys = data.Contents.map(obj => obj.Key);

      const imageUrls = await Promise.all(objectKeys.map(async (key) => {
        const getParams = {
          Bucket: "lgdimagebucket",
          Key: key,
        };
        const response = await s3Client.send(new GetObjectCommand(getParams));
        
        // Check if the response.Body is indeed a ReadableStream
        if (response.Body instanceof ReadableStream) {
          const reader = response.Body.getReader();
      
          let chunks = []; // Array to hold the chunks of data
          let finished = false;
          while (!finished) {
            const { done, value } = await reader.read();
            if (done) {
              finished = true;
            } else {
              chunks.push(value);
            }
          }
      
          // Convert the chunks into a single Uint8Array
          let uint8Array = new Uint8Array(chunks.reduce((acc, val) => acc.concat(Array.from(val)), []));
          // Create a blob from the Uint8Array
          const blob = new Blob([uint8Array], { type: 'image/png' }); // Adjust the type if necessary
          return URL.createObjectURL(blob);
        }
      }));

      setImages(imageUrls);
    } catch (error) {
      console.error("Error fetching images from S3", error);
    }
  };


  return (
    <main id="screen" className={`w-screen h-screen ${enabled ? "" : "dark"}`}>
      <div className="h-full w-full dark:bg-gray-900 overflow-auto duration-200">
        <Canvas />
        <div className="flex justify-center items-center h-24 mt-24 mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">User Generated Images</h1>
        </div>
        <div class="pb-16 px-24 md:px-48 md:pb-48">
          <div class="columns-1 gap-5 sm:columns-2 sm:gap-8 md:columns-3 lg:columns-4 [&>img:not(:first-child)]:mt-8">
            {images.map((imageUrl, index) => {
              return <img key={index} src={imageUrl} alt="Generated" className="object-cover w-full shadow-md ring-1 ring-gray-300 rounded-xl dark-shadow-gray-400 duration-200" style={{ height: `${Math.floor(Math.random() * 250) + 200}px` }} />;
            })}
          </div>
      </div>

      </div>
      <div className="absolute top-5 left-6">
        <Switch
          checked={enabled}
          onChange={setEnabled}
          className={`${enabled ? 'bg-slate-400' : 'bg-slate-700'}
            relative inline-flex h-[24px] w-[48px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75`}
        >
          <span className="sr-only">Use setting</span>
          <span
            aria-hidden="true"
            className={`${enabled ? 'translate-x-6' : 'translate-x-0'}
              pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
          />
        </Switch>
      </div>
      <ToastContainer />
    </main>
  );
}

export default App;
