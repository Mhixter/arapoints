import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageCircle, Send, Loader2, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  sender: "user" | "admin";
  message: string;
  timestamp: string;
}

export default function Chat() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "user",
      message: "Hello, I need help with my last transaction",
      timestamp: "10:30 AM",
    },
    {
      id: 2,
      sender: "admin",
      message: "Hi! Thank you for reaching out. I'm here to help. Could you please provide your transaction ID?",
      timestamp: "10:32 AM",
    },
    {
      id: 3,
      sender: "user",
      message: "The transaction ID is TXN-2024-001234",
      timestamp: "10:33 AM",
    },
    {
      id: 4,
      sender: "admin",
      message: "Thank you! I found your transaction. It was successful. Is there something specific I can help you with?",
      timestamp: "10:35 AM",
    },
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast({ title: "Message required", description: "Please enter a message.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "user",
          message: message.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        {
          id: prev.length + 2,
          sender: "admin",
          message: "Thank you for your message. We'll get back to you shortly.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setMessage("");
      setLoading(false);
      toast({ title: "Message sent", description: "Your message has been sent to support." });
    }, 1000);
  };

  const handleCreateTicket = () => {
    if (!subject || !category || !message) {
      toast({ title: "Missing Information", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    toast({ title: "Ticket Created", description: "Your support ticket has been created successfully." });
    setSubject("");
    setCategory("");
    setMessage("");
  };

  const handleWhatsAppContact = () => {
    const adminPhone = "2348012345678"; // Admin WhatsApp number
    const message = "Hello, I need support with my Arapoint account.";
    const whatsappURL = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Support & Chat
          </h2>
          <p className="text-muted-foreground">Contact admin via WhatsApp or file a support ticket</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* WhatsApp Chat */}
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Chat on WhatsApp
            </CardTitle>
            <CardDescription>Direct message with our admin team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="h-24 w-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="h-12 w-12 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.99 1.515A9.864 9.864 0 005.064 9.67a9.876 9.876 0 001.44 19.038h.005c2.46 0 4.659-.774 6.53-2.097l.36.023a9.864 9.864 0 009.382-9.353c.111-5.159-3.637-9.643-8.784-9.798"/>
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Chat instantly with our admin team on WhatsApp</p>
                <p className="text-xs text-muted-foreground">Phone: +234 801 234 5678</p>
              </div>
            </div>
            <Button 
              onClick={handleWhatsAppContact} 
              className="w-full bg-green-600 hover:bg-green-700 h-12"
              data-testid="button-whatsapp-contact"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Open WhatsApp Chat
            </Button>
          </CardContent>
        </Card>

        {/* Support Ticket */}
        <Card>
          <CardHeader>
            <CardTitle>File a Complaint</CardTitle>
            <CardDescription>Create a support ticket for your issue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Brief subject of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                data-testid="input-subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transaction">Transaction Issue</SelectItem>
                  <SelectItem value="payment">Payment Issue</SelectItem>
                  <SelectItem value="verification">Verification Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                data-testid="textarea-description"
              />
            </div>
            <Button onClick={handleCreateTicket} className="w-full" data-testid="button-create-ticket">
              Create Support Ticket
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
