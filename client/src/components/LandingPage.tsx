import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Code2, Command, Terminal, GitBranch, Settings, Share2, Zap, Loader2, Menu, X } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export function LandingPage() {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLaunchIDE = () => {
    if (user) {
      setLocation('/editor');
    } else {
      setLocation('/auth');
    }
  };

  const scrollToSection = (sectionId: string) => {
    console.log(`Attempting to scroll to section: ${sectionId}`);
    const element = document.getElementById(sectionId);
    if (element) {
      console.log(`Found element with id: ${sectionId}, scrolling...`);
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    } else {
      console.warn(`Element with id: ${sectionId} not found`);
    }
    setIsMenuOpen(false);
  };

  const features = [
    { 
      icon: <Code2 className="h-6 w-6" />, 
      title: "AI-Powered Coding",
      description: "Smart code suggestions and real-time assistance powered by advanced AI" 
    },
    { 
      icon: <Command className="h-6 w-6" />, 
      title: "Command Palette",
      description: "Quick access to all IDE features through a powerful command interface" 
    },
    { 
      icon: <Terminal className="h-6 w-6" />, 
      title: "Integrated Terminal",
      description: "Built-in terminal for seamless development workflow" 
    },
    { 
      icon: <GitBranch className="h-6 w-6" />, 
      title: "Git Integration",
      description: "Version control right from your IDE" 
    },
    { 
      icon: <Settings className="h-6 w-6" />, 
      title: "Customizable",
      description: "Personalize your workspace with themes and extensions" 
    },
    { 
      icon: <Share2 className="h-6 w-6" />, 
      title: "Collaboration",
      description: "Real-time code sharing and pair programming" 
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-200 ${isScrolled ? 'bg-background/95 backdrop-blur-sm border-b' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold">
              AI IDE
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm hover:text-primary">Features</Link>
              <Link href="#preview" className="text-sm hover:text-primary">Preview</Link>
              <Link href="#cta" className="text-sm hover:text-primary">Get Started</Link>
              <Button onClick={handleLaunchIDE} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Launch IDE'
                )}
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-4 py-2 hover:bg-accent rounded-lg"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('preview')}
                className="block w-full text-left px-4 py-2 hover:bg-accent rounded-lg"
              >
                Preview
              </button>
              <button
                onClick={() => scrollToSection('cta')}
                className="block w-full text-left px-4 py-2 hover:bg-accent rounded-lg"
              >
                Get Started
              </button>
              <div className="px-4">
                <Button onClick={handleLaunchIDE} className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Launch IDE'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-16">
        <div id="hero" className="relative px-6 lg:px-8 pt-20 pb-32 sm:pt-48 sm:pb-40">
          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-primary/10 rounded-full"
                style={{
                  width: Math.random() * 300 + 100,
                  height: Math.random() * 300 + 100,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, 30, 0],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 5 + Math.random() * 3,
                  repeat: Infinity,
                  delay: i * 0.7,
                }}
              />
            ))}
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <motion.h1 
              className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Modern AI-Powered IDE
            </motion.h1>
            <motion.p 
              className="mt-6 text-lg leading-8 text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Experience the future of coding with our intelligent development environment.
              Featuring AI assistance, modern interface, and powerful developer tools.
            </motion.p>
            <motion.div 
              className="mt-8 flex gap-x-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Button 
                size="lg" 
                className="px-8 bg-primary hover:bg-primary/90"
                onClick={handleLaunchIDE}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Launch IDE'
                )}
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="https://github.com/your-repo" target="_blank" rel="noopener">
                  View on GitHub
                </a>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Interface Preview */}
      <motion.div 
        id="preview"
        className="relative mx-auto max-w-7xl px-6 lg:px-8 py-20"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="overflow-hidden rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
          <div className="bg-card/70 p-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 text-xs text-muted-foreground text-center">
              Advanced AI IDE
            </div>
          </div>
          <div className="h-[400px] bg-background rounded-b-lg relative overflow-hidden">
            {/* Code Editor Preview */}
            <div className="absolute inset-0 bg-editor-bg p-4">
              <pre className="text-sm text-muted-foreground">
                <code>{`function example() {
  // AI-powered code completion
  const result = await ai.complete(
    "Calculate fibonacci"
  );

  // Smart suggestions
  return result.code;
}`}</code>
              </pre>
              {/* Floating AI suggestion */}
              <motion.div 
                className="absolute right-8 top-8 bg-popover/95 backdrop-blur-sm rounded-lg p-4 border border-border shadow-lg"
                animate={{ 
                  y: [0, 10, 0],
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>AI Suggestion</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Consider using memoization for better performance
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need for a modern development workflow
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="flex flex-col gap-4 rounded-lg border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="p-2 w-fit rounded-lg bg-primary/10">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div id="cta" className="relative py-24">
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center text-center">
          <motion.h2 
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Start Coding Smarter Today
          </motion.h2>
          <motion.p 
            className="mt-4 text-lg text-muted-foreground max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join developers worldwide who are already using our AI-powered IDE to write better code faster.
          </motion.p>
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Button size="lg" className="px-8" onClick={handleLaunchIDE}>
              Get Started
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}