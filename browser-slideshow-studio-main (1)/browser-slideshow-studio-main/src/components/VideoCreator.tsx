import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Upload, Film, Download, Image as ImageIcon, Music, Eye } from "lucide-react";
import { toast } from "sonner";
import logo90Minutes from "@/assets/logo-90minutes.png";
import logoOneMinute from "@/assets/logo-oneminute.png";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const FPS = 30;

interface VideoConfig {
  audioFile: File | null;
  audioDuration: number;
  imageFiles: File[];
  selectedLogo: "logo1" | "logo2";
}

export const VideoCreator = () => {
  const [video1, setVideo1] = useState<VideoConfig>({
    audioFile: null,
    audioDuration: 0,
    imageFiles: [],
    selectedLogo: "logo1"
  });
  const [video2, setVideo2] = useState<VideoConfig>({
    audioFile: null,
    audioDuration: 0,
    imageFiles: [],
    selectedLogo: "logo2"
  });
  
  const logoSize = 400; // Fixed logo size
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress1, setProgress1] = useState(0);
  const [progress2, setProgress2] = useState(0);
  const [video1Url, setVideo1Url] = useState<string>("");
  const [video2Url, setVideo2Url] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showLogoPreview, setShowLogoPreview] = useState(true);
  
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const preview1CanvasRef = useRef<HTMLCanvasElement>(null);
  const preview2CanvasRef = useRef<HTMLCanvasElement>(null);
  const audio1ElementRef = useRef<HTMLAudioElement>(null);
  const audio2ElementRef = useRef<HTMLAudioElement>(null);
  
  const logoImages = useRef<{
    logo1: HTMLImageElement;
    logo2: HTMLImageElement;
  } | null>(null);

  useEffect(() => {
    // Preload watermark logos
    const img1 = new Image();
    const img2 = new Image();
    img1.src = logo90Minutes;
    img2.src = logoOneMinute;
    
    Promise.all([
      new Promise(resolve => { img1.onload = resolve; }),
      new Promise(resolve => { img2.onload = resolve; })
    ]).then(() => {
      logoImages.current = { logo1: img1, logo2: img2 };
    });
  }, []);

  // Update preview for video 1
  useEffect(() => {
    updatePreview(video1, preview1CanvasRef);
  }, [video1.imageFiles, video1.selectedLogo, showLogoPreview]);

  // Update preview for video 2
  useEffect(() => {
    updatePreview(video2, preview2CanvasRef);
  }, [video2.imageFiles, video2.selectedLogo, showLogoPreview]);

  const updatePreview = (config: VideoConfig, canvasRef: React.RefObject<HTMLCanvasElement>) => {
    if (config.imageFiles.length === 0 || !logoImages.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = URL.createObjectURL(config.imageFiles[0]);
    
    img.onload = () => {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      // Clear canvas
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw image (cover fit)
      const imageAspect = img.width / img.height;
      const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imageAspect > canvasAspect) {
        drawHeight = CANVAS_HEIGHT;
        drawWidth = drawHeight * imageAspect;
        drawX = (CANVAS_WIDTH - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = CANVAS_WIDTH;
        drawHeight = drawWidth / imageAspect;
        drawX = 0;
        drawY = (CANVAS_HEIGHT - drawHeight) / 2;
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Draw logo (fixed at top right corner, 110px from top) - only if preview toggle is on
      if (showLogoPreview) {
        const selectedLogoImage = config.selectedLogo === "logo1" ? logoImages.current!.logo1 : logoImages.current!.logo2;
        const logoWidth = logoSize;
        const logoHeight = (selectedLogoImage.height / selectedLogoImage.width) * logoWidth;
        const logoX = CANVAS_WIDTH - logoWidth - 50; // 50px padding from right
        const logoY = 110;
        
        ctx.globalAlpha = 0.9;
        ctx.drawImage(selectedLogoImage, logoX, logoY, logoWidth, logoHeight);
        ctx.globalAlpha = 1;
      }
    };
  };

  const handleAudio1Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        setVideo1({ ...video1, audioFile: file, audioDuration: audio.duration });
        toast.success(`Video 1 audio loaded: ${Math.round(audio.duration)}s`);
      };
    }
  };

  const handleImage1Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setVideo1({ ...video1, imageFiles: fileArray });
      toast.success(`Video 1: ${fileArray.length} image${fileArray.length > 1 ? 's' : ''} loaded`);
    }
  };

  const handleAudio2Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        setVideo2({ ...video2, audioFile: file, audioDuration: audio.duration });
        toast.success(`Video 2 audio loaded: ${Math.round(audio.duration)}s`);
      };
    }
  };

  const handleImage2Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setVideo2({ ...video2, imageFiles: fileArray });
      toast.success(`Video 2: ${fileArray.length} image${fileArray.length > 1 ? 's' : ''} loaded`);
    }
  };

  const createVideoInstance = async (
    config: VideoConfig,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    audioElementRef: React.RefObject<HTMLAudioElement>,
    setProgress: (progress: number) => void,
    videoNum: number
  ): Promise<string> => {
    if (!config.audioFile || config.imageFiles.length === 0 || !logoImages.current) {
      throw new Error(`Video ${videoNum} is missing required files`);
    }

    const canvas = canvasRef.current;
    if (!canvas) throw new Error(`Canvas ${videoNum} not available`);
    
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(`Canvas ${videoNum} context not available`);
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Load all images
    const loadedImages = await Promise.all(
      config.imageFiles.map((file) => 
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image for video ${videoNum}`));
          img.src = URL.createObjectURL(file);
        })
      )
    );

    const videoDuration = config.audioDuration;
    
    // Setup audio element
    const audioElement = audioElementRef.current;
    if (!audioElement) throw new Error(`Audio element ${videoNum} not available`);
    
    audioElement.src = URL.createObjectURL(config.audioFile);
    await new Promise((resolve, reject) => {
      audioElement.onloadeddata = resolve;
      audioElement.onerror = reject;
    });

    // Setup streams
    const canvasStream = canvas.captureStream(FPS);
    const audioContext = new AudioContext({ sampleRate: 48000 });
    const audioSource = audioContext.createMediaElementSource(audioElement);
    const audioDestination = audioContext.createMediaStreamDestination();
    
    audioSource.connect(audioDestination);
    audioSource.connect(audioContext.destination);

    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioDestination.stream.getAudioTracks()
    ]);

    let mimeType = "video/webm;codecs=vp8,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp9,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }
    }

    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: mimeType,
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 2500000
    });
    
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    const recordingPromise = new Promise<string>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        audioContext.close();
        resolve(url);
      };
      
      mediaRecorder.onerror = (e) => {
        reject(new Error(`Recording error for video ${videoNum}`));
      };
    });

    mediaRecorder.start(100);
    audioElement.currentTime = 0;
    await audioElement.play();

    const startTime = Date.now();
    const selectedLogoImage = config.selectedLogo === "logo1" ? logoImages.current.logo1 : logoImages.current.logo2;
    const transitionDuration = 1.0; // 1 second transition
    const timePerImage = videoDuration / loadedImages.length;
    
    const drawFrame = () => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      
      if (elapsedTime >= videoDuration) {
        mediaRecorder.stop();
        audioElement.pause();
        audioElement.currentTime = 0;
        return;
      }
      
      setProgress((elapsedTime / videoDuration) * 100);
      
      // Clear canvas
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Determine current and next image indices
      const currentIndex = Math.floor(elapsedTime / timePerImage);
      const nextIndex = (currentIndex + 1) % loadedImages.length;
      const timeInCurrentImage = elapsedTime % timePerImage;
      const transitionProgress = Math.min(timeInCurrentImage / transitionDuration, 1);

      const currentImage = loadedImages[currentIndex];
      const nextImage = loadedImages[nextIndex];

      // Draw current image (cover fit)
      const imageAspect = currentImage.width / currentImage.height;
      const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imageAspect > canvasAspect) {
        drawHeight = CANVAS_HEIGHT;
        drawWidth = drawHeight * imageAspect;
        drawX = (CANVAS_WIDTH - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = CANVAS_WIDTH;
        drawHeight = drawWidth / imageAspect;
        drawX = 0;
        drawY = (CANVAS_HEIGHT - drawHeight) / 2;
      }
      
      ctx.drawImage(currentImage, drawX, drawY, drawWidth, drawHeight);

      // Draw next image with fade transition if within transition period
      if (timeInCurrentImage < transitionDuration && loadedImages.length > 1) {
        const nextImageAspect = nextImage.width / nextImage.height;
        let nextDrawWidth, nextDrawHeight, nextDrawX, nextDrawY;
        
        if (nextImageAspect > canvasAspect) {
          nextDrawHeight = CANVAS_HEIGHT;
          nextDrawWidth = nextDrawHeight * nextImageAspect;
          nextDrawX = (CANVAS_WIDTH - nextDrawWidth) / 2;
          nextDrawY = 0;
        } else {
          nextDrawWidth = CANVAS_WIDTH;
          nextDrawHeight = nextDrawWidth / nextImageAspect;
          nextDrawX = 0;
          nextDrawY = (CANVAS_HEIGHT - nextDrawHeight) / 2;
        }
        
        ctx.globalAlpha = transitionProgress;
        ctx.drawImage(nextImage, nextDrawX, nextDrawY, nextDrawWidth, nextDrawHeight);
        ctx.globalAlpha = 1;
      }

      // Draw logo (top right corner, 110px from top)
      const logoWidth = logoSize;
      const logoHeight = (selectedLogoImage.height / selectedLogoImage.width) * logoWidth;
      const logoX = CANVAS_WIDTH - logoWidth - 50; // 50px padding from right
      const logoY = 110;
      
      ctx.globalAlpha = 0.9;
      ctx.drawImage(selectedLogoImage, logoX, logoY, logoWidth, logoHeight);
      ctx.globalAlpha = 1;
      
      requestAnimationFrame(drawFrame);
    };
    
    drawFrame();
    return recordingPromise;
  };

  const createVideos = async () => {
    if (!video1.audioFile || video1.imageFiles.length === 0) {
      toast.error("Please upload audio and images for Video 1");
      return;
    }
    if (!video2.audioFile || video2.imageFiles.length === 0) {
      toast.error("Please upload audio and images for Video 2");
      return;
    }

    setIsProcessing(true);
    setProgress1(0);
    setProgress2(0);
    setStatusMessage("Creating videos...");
    setVideo1Url("");
    setVideo2Url("");

    try {
      const [url1, url2] = await Promise.all([
        createVideoInstance(video1, canvas1Ref, audio1ElementRef, setProgress1, 1),
        createVideoInstance(video2, canvas2Ref, audio2ElementRef, setProgress2, 2)
      ]);

      setVideo1Url(url1);
      setVideo2Url(url2);
      setStatusMessage("Videos ready!");
      toast.success("Both videos created successfully!");
    } catch (error) {
      console.error("Video creation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to create videos: ${errorMessage}`);
      setStatusMessage(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const canCreateVideos = video1.audioFile && video1.imageFiles.length > 0 && video2.audioFile && video2.imageFiles.length > 0 && !isProcessing;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-primary/10 p-3">
            <img src={logo90Minutes} alt="90 Minutes News" className="h-12 w-auto" />
          </div>
          <h1 className="mb-2 text-4xl tracking-tight font-bold">90 minute news Official video editor</h1>
          <p className="text-muted-foreground">Create two HD portrait videos simultaneously</p>
        </header>

        <Card className="mb-6 border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Logo Preview</h3>
                <p className="text-sm text-muted-foreground">Toggle logo visibility on preview canvases</p>
              </div>
            </div>
            <Switch 
              checked={showLogoPreview} 
              onCheckedChange={setShowLogoPreview}
            />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Video 1 Configuration */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Video 1</h2>
            
            <Card className="overflow-hidden border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Music className="h-5 w-5 text-primary" />
                Audio File
              </h3>
              <div className="space-y-4">
                <Label htmlFor="audio1-upload" className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary hover:bg-secondary">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {video1.audioFile ? video1.audioFile.name : "Click to upload audio"}
                  </span>
                  {video1.audioDuration > 0 && (
                    <span className="mt-1 text-xs text-primary">
                      Duration: {Math.round(video1.audioDuration)}s
                    </span>
                  )}
                </Label>
                <input id="audio1-upload" type="file" accept="audio/*" onChange={handleAudio1Upload} className="hidden" />
              </div>
            </Card>

            <Card className="overflow-hidden border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <ImageIcon className="h-5 w-5 text-primary" />
                Image
              </h3>
              <div className="space-y-4">
                <Label htmlFor="image1-upload" className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary hover:bg-secondary">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {video1.imageFiles.length > 0 ? `${video1.imageFiles.length} image${video1.imageFiles.length > 1 ? 's' : ''} selected` : "Click to upload images"}
                  </span>
                </Label>
                <input id="image1-upload" type="file" accept="image/*" multiple onChange={handleImage1Upload} className="hidden" />
                {video1.imageFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {video1.imageFiles.map((file, idx) => (
                      <div key={idx} className="aspect-square overflow-hidden rounded-md border border-border">
                        <img src={URL.createObjectURL(file)} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="overflow-hidden border-border bg-card p-6">
              <h3 className="mb-4 text-xl font-semibold">Logo</h3>
              <RadioGroup value={video1.selectedLogo} onValueChange={val => setVideo1({ ...video1, selectedLogo: val as "logo1" | "logo2" })}>
                <div className="grid grid-cols-2 gap-4">
                  <Label htmlFor="v1-logo1" className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${video1.selectedLogo === "logo1" ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-primary/50"}`}>
                    <RadioGroupItem value="logo1" id="v1-logo1" className="sr-only" />
                    <img src={logo90Minutes} alt="90 Minutes" className="mb-2 h-16 w-auto" />
                    <span className="text-sm font-medium">90 Minutes</span>
                  </Label>
                  <Label htmlFor="v1-logo2" className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${video1.selectedLogo === "logo2" ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-primary/50"}`}>
                    <RadioGroupItem value="logo2" id="v1-logo2" className="sr-only" />
                    <img src={logoOneMinute} alt="One Minute" className="mb-2 h-16 w-auto" />
                    <span className="text-sm font-medium">One Minute</span>
                  </Label>
                </div>
              </RadioGroup>
            </Card>

            {video1.imageFiles.length > 0 && (
              <Card className="overflow-hidden border-border bg-card p-6">
                <h3 className="mb-4 text-xl font-semibold">Preview</h3>
                <div className="w-full rounded-lg border border-border bg-black overflow-hidden">
                  <canvas ref={preview1CanvasRef} className="w-full" />
                </div>
              </Card>
            )}

            {isProcessing && (
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 text-xl font-semibold">Video 1 Progress</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Creating...</span>
                    <span className="font-medium text-primary">{Math.round(progress1)}%</span>
                  </div>
                  <Progress value={progress1} className="h-2" />
                </div>
              </Card>
            )}

            {video1Url && (
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 text-xl font-semibold">Video 1 Ready</h3>
                <div className="space-y-4">
                  <video src={video1Url} controls className="w-full rounded-lg border border-border" />
                  <Button asChild className="w-full" size="lg">
                    <a href={video1Url} download="video-1.webm">
                      <Download className="mr-2 h-4 w-4" />
                      Download Video 1
                    </a>
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Video 2 Configuration */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Video 2</h2>
            
            <Card className="overflow-hidden border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Music className="h-5 w-5 text-primary" />
                Audio File
              </h3>
              <div className="space-y-4">
                <Label htmlFor="audio2-upload" className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary hover:bg-secondary">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {video2.audioFile ? video2.audioFile.name : "Click to upload audio"}
                  </span>
                  {video2.audioDuration > 0 && (
                    <span className="mt-1 text-xs text-primary">
                      Duration: {Math.round(video2.audioDuration)}s
                    </span>
                  )}
                </Label>
                <input id="audio2-upload" type="file" accept="audio/*" onChange={handleAudio2Upload} className="hidden" />
              </div>
            </Card>

            <Card className="overflow-hidden border-border bg-card p-6">
              <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <ImageIcon className="h-5 w-5 text-primary" />
                Image
              </h3>
              <div className="space-y-4">
                <Label htmlFor="image2-upload" className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary hover:bg-secondary">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {video2.imageFiles.length > 0 ? `${video2.imageFiles.length} image${video2.imageFiles.length > 1 ? 's' : ''} selected` : "Click to upload images"}
                  </span>
                </Label>
                <input id="image2-upload" type="file" accept="image/*" multiple onChange={handleImage2Upload} className="hidden" />
                {video2.imageFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {video2.imageFiles.map((file, idx) => (
                      <div key={idx} className="aspect-square overflow-hidden rounded-md border border-border">
                        <img src={URL.createObjectURL(file)} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="overflow-hidden border-border bg-card p-6">
              <h3 className="mb-4 text-xl font-semibold">Logo</h3>
              <RadioGroup value={video2.selectedLogo} onValueChange={val => setVideo2({ ...video2, selectedLogo: val as "logo1" | "logo2" })}>
                <div className="grid grid-cols-2 gap-4">
                  <Label htmlFor="v2-logo1" className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${video2.selectedLogo === "logo1" ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-primary/50"}`}>
                    <RadioGroupItem value="logo1" id="v2-logo1" className="sr-only" />
                    <img src={logo90Minutes} alt="90 Minutes" className="mb-2 h-16 w-auto" />
                    <span className="text-sm font-medium">90 Minutes</span>
                  </Label>
                  <Label htmlFor="v2-logo2" className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${video2.selectedLogo === "logo2" ? "border-primary bg-primary/10" : "border-border bg-secondary/50 hover:border-primary/50"}`}>
                    <RadioGroupItem value="logo2" id="v2-logo2" className="sr-only" />
                    <img src={logoOneMinute} alt="One Minute" className="mb-2 h-16 w-auto" />
                    <span className="text-sm font-medium">One Minute</span>
                  </Label>
                </div>
              </RadioGroup>
            </Card>

            {video2.imageFiles.length > 0 && (
              <Card className="overflow-hidden border-border bg-card p-6">
                <h3 className="mb-4 text-xl font-semibold">Preview</h3>
                <div className="w-full rounded-lg border border-border bg-black overflow-hidden">
                  <canvas ref={preview2CanvasRef} className="w-full" />
                </div>
              </Card>
            )}

            {isProcessing && (
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 text-xl font-semibold">Video 2 Progress</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Creating...</span>
                    <span className="font-medium text-primary">{Math.round(progress2)}%</span>
                  </div>
                  <Progress value={progress2} className="h-2" />
                </div>
              </Card>
            )}

            {video2Url && (
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 text-xl font-semibold">Video 2 Ready</h3>
                <div className="space-y-4">
                  <video src={video2Url} controls className="w-full rounded-lg border border-border" />
                  <Button asChild className="w-full" size="lg">
                    <a href={video2Url} download="video-2.webm">
                      <Download className="mr-2 h-4 w-4" />
                      Download Video 2
                    </a>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={createVideos} disabled={!canCreateVideos} className="w-full max-w-md" size="lg">
            <Film className="mr-2 h-5 w-5" />
            {isProcessing ? "Creating Videos..." : "Create Both Videos"}
          </Button>
        </div>

        {!isProcessing && !video1Url && !video2Url && (
          <Card className="mt-8 border-border bg-card p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Film className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Ready to Create Two Videos</h3>
              <p className="text-sm text-muted-foreground">
                Configure both videos with their audio, image, and logo, then click "Create Both Videos"
              </p>
            </div>
          </Card>
        )}
      </div>

      <canvas ref={canvas1Ref} className="hidden" />
      <canvas ref={canvas2Ref} className="hidden" />
      <audio ref={audio1ElementRef} className="hidden" />
      <audio ref={audio2ElementRef} className="hidden" />
    </div>
  );
};
