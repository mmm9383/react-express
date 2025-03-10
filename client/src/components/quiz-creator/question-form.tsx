import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Question } from "@shared/schema";
import { Plus, Minus, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  onAdd: (question: Question) => void;
  initialQuestion?: Question;
};

export default function QuestionForm({ onAdd, initialQuestion }: Props) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [explanation, setExplanation] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (initialQuestion) {
      setText(initialQuestion.text);
      setOptions(initialQuestion.options);
      setCorrectAnswer(initialQuestion.correctAnswer);
      setExplanation(initialQuestion.explanation || "");
      setTimeLimit(initialQuestion.timeLimit || 30);
      setImageUrl(initialQuestion.imageUrl || "");
      setImagePreview(initialQuestion.imageUrl || "");
    }
  }, [initialQuestion]);

  const resetForm = () => {
    setText("");
    setOptions(["", ""]);
    setCorrectAnswer(null);
    setExplanation("");
    setTimeLimit(30);
    setImageUrl("");
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        compressImage(base64String, 1200, 0.7).then(optimizedImage => {
          setImageUrl(optimizedImage);
          setImagePreview(optimizedImage);
        });
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read image file",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
    }
  };

  // Function to compress images before uploading
  const compressImage = (dataUrl: string, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down the image if it's wider than maxWidth
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with the specified quality
        const optimizedImage = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedImage);
      };
    });
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
    if (correctAnswer === index) {
      setCorrectAnswer(null);
    } else if (correctAnswer !== null && correctAnswer > index) {
      setCorrectAnswer(correctAnswer - 1);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || options.some((opt) => !opt) || correctAnswer === null) {
      toast({
        title: "Incomplete form",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const question: Question = {
      text,
      options,
      correctAnswer,
      explanation,
      timeLimit,
      imageUrl: imageUrl || undefined,
    };

    onAdd(question);
    resetForm();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="question">Question Text</Label>
        <Textarea
          id="question"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1"
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="image" className="flex-grow">Image (Optional)</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('image')?.click()}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
        </div>
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Question" className="max-h-48 rounded-lg" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setImageUrl("");
                setImagePreview("");
              }}
            >
              Remove Image
            </Button>
          </div>
        )}
      </div>

      <div>
        <Label>Options</Label>
        <div className="space-y-2 mt-1">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCorrectAnswer(index)}
                className={
                  correctAnswer === index ? "border-green-500" : undefined
                }
              >
                ✓
              </Button>
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeOption(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      <div>
        <Label htmlFor="explanation">Explanation (Optional)</Label>
        <Textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
        <Input
          id="timeLimit"
          type="number"
          min="5"
          max="300"
          value={timeLimit}
          onChange={(e) => setTimeLimit(parseInt(e.target.value))}
          className="mt-1"
        />
      </div>

      <Button type="submit" className="w-full">
        {initialQuestion ? "Update Question" : "Add Question"}
      </Button>
    </form>
  );
}