/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Scan, 
  Image as ImageIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  Camera, 
  CreditCard, 
  Activity,
  History,
  X,
  ChevronRight,
  Info
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { analyzeImage, verifyTransaction } from './services/ai';
import { Transaction, QRMetadata, DetectionResult } from './types';
import { cn } from './lib/utils';

type Tab = 'image' | 'qr' | 'transaction';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('image');
  const [loading, setLoading] = useState(false);
  
  // Image Detection State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  
  // QR State
  const [qrResult, setQrResult] = useState<QRMetadata | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Transaction State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    amount: 0,
    merchant: '',
    location: '',
    category: 'Shopping'
  });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setSelectedImage(dataUrl);
        stopCamera();
        setDetectionResult(null);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setDetectionResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runImageDetection = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      const result = await analyzeImage(selectedImage);
      setDetectionResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startQRScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scanner.render((decodedText) => {
        setQrResult({
          source: "Camera Scan",
          user: "Current User",
          timestamp: new Date().toLocaleString(),
          type: "QR_CODE",
          payload: decodedText
        });
        scanner.clear();
        setIsScanning(false);
      }, (error) => {
        // console.warn(error);
      });
    }, 100);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await verifyTransaction(newTx);
      const tx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        amount: Number(newTx.amount),
        currency: 'USD',
        merchant: newTx.merchant || 'Unknown Merchant',
        timestamp: new Date().toLocaleString(),
        location: newTx.location || 'Online',
        category: newTx.category || 'General',
        ...result
      };
      setTransactions([tx, ...transactions]);
      setNewTx({ amount: 0, merchant: '', location: '', category: 'Shopping' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">POLICYGUARD AI</h1>
              <p className="text-zinc-400 text-sm">HMX3001 – AI Cloud Threat Hunting System</p>
            </div>
          </div>

          <nav className="flex p-1 glass rounded-xl">
            {(['image', 'qr', 'transaction'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize",
                  activeTab === tab 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {tab === 'image' ? 'AI Detection' : tab === 'qr' ? 'QR Scanner' : 'Transactions'}
              </button>
            ))}
          </nav>
        </header>

        <main>
          <AnimatePresence mode="wait">
            {activeTab === 'image' && (
              <motion.div
                key="image"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden group">
                  {loading && selectedImage && (
                    <div className="scan-line animate-scan" />
                  )}
                  
                  {!selectedImage && !isCameraActive ? (
                    <div className="flex flex-col items-center gap-6">
                      <label className="cursor-pointer flex flex-col items-center gap-4 group">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                          <Upload className="w-8 h-8 text-zinc-500 group-hover:text-emerald-400" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-zinc-200">Upload Image</p>
                          <p className="text-xs text-zinc-500">JPG, PNG or WebP</p>
                        </div>
                        <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                      </label>
                      
                      <div className="flex items-center gap-4 w-full">
                        <div className="h-px bg-zinc-800 flex-1" />
                        <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">OR</span>
                        <div className="h-px bg-zinc-800 flex-1" />
                      </div>

                      <button 
                        onClick={startCamera}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-emerald-500/50 transition-all text-sm font-medium"
                      >
                        <Camera className="w-4 h-4 text-emerald-400" /> Scan with Camera
                      </button>
                    </div>
                  ) : isCameraActive ? (
                    <div className="relative w-full h-full flex flex-col items-center">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute bottom-6 flex gap-4">
                        <button 
                          onClick={capturePhoto}
                          className="p-4 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40 hover:scale-110 transition-transform"
                        >
                          <Camera className="w-6 h-6 text-white" />
                        </button>
                        <button 
                          onClick={stopCamera}
                          className="p-4 bg-zinc-900/80 backdrop-blur-md rounded-full border border-zinc-800 hover:bg-red-500/50 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <img src={selectedImage!} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                      <button 
                        onClick={() => {setSelectedImage(null); setDetectionResult(null);}}
                        className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-red-500/50 transition-colors z-30"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-6">
                  <div className="glass rounded-3xl p-8">
                    <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-emerald-400" />
                      Analysis Results
                    </h2>
                    
                    {!detectionResult ? (
                      <div className="space-y-6">
                        <p className="text-zinc-400 text-sm">
                          Upload an image to analyze its authenticity. Our AI model will detect patterns typical of generative AI.
                        </p>
                        <button
                          disabled={!selectedImage || loading}
                          onClick={runImageDetection}
                          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <Activity className="w-5 h-5 animate-spin" />
                          ) : (
                            <>Analyze Image <ChevronRight className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">AI Probability</p>
                            <p className={cn(
                              "text-4xl font-display font-bold",
                              detectionResult.probability > 70 ? "text-red-400" : 
                              detectionResult.probability > 30 ? "text-orange-400" : "text-emerald-400"
                            )}>
                              {detectionResult.probability}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Threat Level</p>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                              detectionResult.probability > 70 ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                              detectionResult.probability > 30 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : 
                              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            )}>
                              {detectionResult.probability > 70 ? 'CRITICAL' : 
                               detectionResult.probability > 30 ? 'ELEVATED' : 'LOW'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4 glass rounded-xl">
                          <p className="text-sm leading-relaxed text-zinc-300">
                            <span className="font-bold text-zinc-100">Findings:</span> {detectionResult.explanation}
                          </p>
                        </div>

                        <button
                          onClick={() => {setSelectedImage(null); setDetectionResult(null);}}
                          className="w-full py-3 border border-zinc-800 hover:bg-zinc-900 rounded-xl text-sm font-medium transition-all"
                        >
                          Analyze Another
                        </button>
                      </motion.div>
                    )}
                  </div>

                  <div className="glass rounded-3xl p-6 flex items-start gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Info className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm mb-1">HMX3001 Intelligence</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        The PolicyGuard AI engine analyzes pixel consistency, lighting artifacts, and structural patterns often found in diffusion models to determine AI generation probability.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'qr' && (
              <motion.div
                key="qr"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="glass rounded-3xl p-8 text-center mb-8">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Scan className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2">Secure QR Scanner</h2>
                  <p className="text-zinc-400 mb-8">Identify the source and metadata of any QR code instantly.</p>
                  
                  {!isScanning ? (
                    <button
                      onClick={startQRScanner}
                      className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 mx-auto"
                    >
                      <Camera className="w-5 h-5" /> Start Scanner
                    </button>
                  ) : (
                    <div className="relative">
                      <div id="reader" className="overflow-hidden rounded-2xl border-2 border-emerald-500/30"></div>
                      <button 
                        onClick={() => setIsScanning(false)}
                        className="mt-4 text-zinc-500 hover:text-zinc-300 text-sm underline"
                      >
                        Cancel Scanning
                      </button>
                    </div>
                  )}
                </div>

                {qrResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-3xl p-8 border-emerald-500/20"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="font-bold text-lg">Scan Successful</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase mb-1">Source</p>
                        <p className="text-sm font-medium">{qrResult.source}</p>
                      </div>
                      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase mb-1">Timestamp</p>
                        <p className="text-sm font-medium">{qrResult.timestamp}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 mb-6">
                      <p className="text-[10px] text-zinc-500 uppercase mb-2">Payload Data</p>
                      <code className="text-xs text-emerald-400 break-all">{qrResult.payload}</code>
                    </div>

                    <button
                      onClick={() => setQrResult(null)}
                      className="w-full py-3 border border-zinc-800 hover:bg-zinc-900 rounded-xl text-sm font-medium transition-all"
                    >
                      Scan Another Code
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'transaction' && (
              <motion.div
                key="transaction"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-1">
                  <div className="glass rounded-3xl p-8 sticky top-8">
                    <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                      Verify Transaction
                    </h2>
                    <form onSubmit={handleTransactionSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs text-zinc-500 uppercase mb-1 block">Amount (USD)</label>
                        <input 
                          type="number" 
                          required
                          value={newTx.amount}
                          onChange={(e) => setNewTx({...newTx, amount: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 uppercase mb-1 block">Merchant</label>
                        <input 
                          type="text" 
                          required
                          value={newTx.merchant}
                          onChange={(e) => setNewTx({...newTx, merchant: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                          placeholder="e.g. Amazon, Starbucks"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 uppercase mb-1 block">Location</label>
                        <input 
                          type="text" 
                          required
                          value={newTx.location}
                          onChange={(e) => setNewTx({...newTx, location: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
                          placeholder="e.g. New York, NY"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 mt-4"
                      >
                        {loading ? <Activity className="w-5 h-5 animate-spin" /> : 'Verify Now'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-display font-bold flex items-center gap-2">
                      <History className="w-5 h-5 text-zinc-400" />
                      Verification History
                    </h2>
                    <span className="text-xs text-zinc-500">{transactions.length} total</span>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="glass rounded-3xl p-12 text-center">
                      <p className="text-zinc-500">No transactions verified yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((tx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn(
                            "glass rounded-2xl p-6 border-l-4",
                            tx.isSuspicious ? "border-l-red-500" : "border-l-emerald-500"
                          )}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "p-3 rounded-xl",
                                tx.isSuspicious ? "bg-red-500/10" : "bg-emerald-500/10"
                              )}>
                                {tx.isSuspicious ? (
                                  <AlertTriangle className="w-6 h-6 text-red-400" />
                                ) : (
                                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{tx.merchant}</h3>
                                <p className="text-xs text-zinc-500">{tx.timestamp} • {tx.location}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-display font-bold">${tx.amount.toFixed(2)}</p>
                              <p className={cn(
                                "text-xs font-medium uppercase tracking-widest",
                                tx.isSuspicious ? "text-red-400" : "text-emerald-400"
                              )}>
                                {tx.isSuspicious ? 'Suspicious' : 'Legit'}
                              </p>
                            </div>
                          </div>
                          
                          {tx.isSuspicious && (
                            <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                              <p className="text-xs text-red-300">
                                <span className="font-bold">Alert:</span> {tx.reason} (Risk Score: {tx.riskScore}/100)
                              </p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
