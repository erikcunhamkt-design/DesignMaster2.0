import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Easing } from "framer-motion";
import {
  Wand2, Zap, Sparkles, ChevronDown,
  Star, ArrowRight, Check, PenTool,
} from "lucide-react";
import logo3d from "@/assets/logo-3d.png";

/* ─── PARTICLE FIELD ─── */
function ParticleField() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/30"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -10, 5, 0],
            opacity: [0.2, 0.6, 0.3, 0.7, 0.2],
            scale: [1, 1.5, 0.8, 1.2, 1],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ─── FLOATING ORB ─── */
function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[80px] pointer-events-none ${className}`}
      animate={{
        scale: [1, 1.3, 0.9, 1.15, 1],
        x: [0, 40, -20, 30, 0],
        y: [0, -30, 20, -15, 0],
      }}
      transition={{ duration: 15, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

/* ─── GLITCH TEXT ─── */
function GlitchText({ children, className }: { children: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent z-0"
        animate={{ opacity: [0, 0.5, 0, 0.3, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        aria-hidden
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ─── TILT CARD ─── */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── COUNTER ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame: number;
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [started, target]);

  return <span ref={ref}>{count.toLocaleString("pt-BR")}{suffix}</span>;
}

/* ─── DATA ─── */
const cubicEase: Easing = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: cubicEase },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: cubicEase },
  }),
};

const features = [
  { icon: "🎨", name: "Design Master", desc: "Gerador principal com controles avançados de composição, iluminação e estilo." },
  { icon: "🧠", name: "Creator Master", desc: "Chat especialista em design, viralização e ideias magnéticas para Instagram." },
  { icon: "🎠", name: "Carrossel Master", desc: "Carrosséis de alto impacto com headlines magnéticas e estrutura AIDA." },
  { icon: "📰", name: "Estrategista Editorial", desc: "Linhas editoriais estratégicas com pilares de conteúdo e posicionamento." },
  { icon: "📅", name: "Calendário Master", desc: "Calendários de conteúdo quinzenais com organização e ideias de posts." },
  { icon: "🖥️", name: "Liga dos Heróis", desc: "Hero sections premium para landing pages comparáveis às melhores marcas." },
  { icon: "📦", name: "Laboratório de Mockups", desc: "Mockups realistas de produtos, embalagens e dispositivos." },
  { icon: "🏟️", name: "Clube das Lendas", desc: "Artes de futebol profissionais — matchday, jogador destaque e flyers." },
  { icon: "🏎️", name: "Velozes & Imortais", desc: "Artes automotivas de alta performance com IA." },
  { icon: "🦁", name: "Animais Fantásticos", desc: "Imagens com animais em alta resolução e acabamento premium." },
  { icon: "🖼️", name: "Restaurador de Fotos", desc: "Restaure fotos antigas com IA — riscos, manchas e colorização." },
  { icon: "🔍", name: "Ultra Upscale", desc: "Ampliação inteligente com preservação total da qualidade." },
];

const testimonials = [
  { name: "Lucas M.", role: "Designer Freelancer", text: "Reduziu meu tempo de criação em 80%. Consigo entregar 3x mais projetos por semana.", stars: 5 },
  { name: "Amanda R.", role: "Social Media Manager", text: "Os carrosséis ficam incríveis. Meus clientes adoram e os resultados de engajamento dobraram.", stars: 5 },
  { name: "Rafael S.", role: "Dono de Agência", text: "A qualidade das imagens é impressionante. Parece que contratamos um fotógrafo profissional.", stars: 5 },
  { name: "Juliana P.", role: "Criadora de Conteúdo", text: "Bio Master e Calendário Master me economizam horas de planejamento toda semana.", stars: 5 },
];

const plans = [
  {
    name: "Plano Mensal",
    price: "R$ 69,99",
    originalPrice: "R$ 149,90",
    period: "/mês",
    features: ["Gerações ilimitadas", "Todas as 16+ ferramentas", "Qualidade máxima (4K)", "Suporte prioritário", "Acesso à comunidade", "Novos recursos primeiro", "Cancele quando quiser"],
    cta: "Assinar Agora",
    popular: true,
    url: "https://pay.kiwify.com.br/7b1lH1a",
  },
];

const faqs = [
  { q: "Preciso saber design para usar?", a: "Não! O Design Master foi feito para qualquer pessoa. Os agentes de IA guiam você passo a passo — basta descrever o que quer e a IA cria para você." },
  { q: "Quais modelos de IA são usados?", a: "Utilizamos os modelos mais avançados do mercado, incluindo Gemini e GPT, para garantir a máxima qualidade em todas as gerações." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem compromisso. Cancele quando quiser diretamente nas configurações da sua conta, sem burocracia." },
  { q: "As imagens geradas têm direitos autorais?", a: "Sim, todas as imagens geradas são suas. Você pode usar comercialmente sem restrições em qualquer plataforma." },
  { q: "Funciona no celular?", a: "Sim! O Design Master é totalmente responsivo e funciona como PWA — instale no seu celular como um app nativo." },
  { q: "Quantas ferramentas estão disponíveis?", a: "Atualmente temos 16+ ferramentas especializadas: geradores de imagem, agentes de conteúdo, restauração, upscale, mockups e muito mais." },
];

/* ─── MAIN ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      <ParticleField />

      {/* ─── ANIMATED GRADIENT MESH BG ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <FloatingOrb className="w-[500px] h-[500px] bg-primary/10 top-[10%] left-[10%]" delay={0} />
        <FloatingOrb className="w-[400px] h-[400px] bg-accent/8 top-[40%] right-[5%]" delay={3} />
        <FloatingOrb className="w-[350px] h-[350px] bg-primary/6 bottom-[10%] left-[30%]" delay={6} />
        {/* Scan line overlay */}
        <motion.div
          className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,hsl(var(--foreground)/0.015)_2px,hsl(var(--foreground)/0.015)_4px)]"
          animate={{ backgroundPositionY: ["0px", "4px"] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* ─── NAVBAR ─── */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 inset-x-0 z-50 border-b border-border/10 bg-background/60 backdrop-blur-2xl"
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.img
              src={logo3d}
              alt="Design Master"
              className="h-9 w-9 rounded-lg object-contain"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Design Master
            </span>
          </motion.div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {["Ferramentas", "Depoimentos", "Planos", "FAQ"].map((item) => (
              <motion.a
                key={item}
                href={`#${item === "Ferramentas" ? "features" : item === "Depoimentos" ? "testimonials" : item === "Planos" ? "pricing" : "faq"}`}
                className="relative hover:text-foreground transition-colors"
                whileHover={{ y: -2 }}
              >
                {item}
                <motion.span
                  className="absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary))" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="px-4 py-2 text-sm font-medium text-foreground rounded-lg border border-border/30 hover:bg-secondary/40 transition-colors"
            >
              Login
            </motion.button>
            <motion.a
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px hsl(var(--primary) / 0.4)" }}
              whileTap={{ scale: 0.95 }}
              href="https://pay.kiwify.com.br/7b1lH1a"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground transition-all"
            >
              Assinar Agora
            </motion.a>
          </div>
        </div>
      </motion.nav>

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6 z-10">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative mx-auto max-w-4xl text-center">
          {/* Animated ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full border border-primary/10 pointer-events-none"
            animate={{ rotate: 360, scale: [1, 1.05, 1] }}
            transition={{ rotate: { duration: 30, repeat: Infinity, ease: "linear" }, scale: { duration: 5, repeat: Infinity } }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[550px] md:h-[550px] rounded-full border border-accent/5 pointer-events-none"
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          />

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <motion.span
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-8"
              animate={{ boxShadow: ["0 0 0px hsl(var(--primary)/0)", "0 0 20px hsl(var(--primary)/0.3)", "0 0 0px hsl(var(--primary)/0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
              Powered by AI
            </motion.span>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Crie Designs{" "}
            <motion.span
              className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
              animate={{ backgroundPosition: ["0% center", "200% center"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              Profissionais
            </motion.span>{" "}
            em Segundos
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Studio completo com 16+ ferramentas de IA para gerar imagens, mockups, carrosséis,
            capas e conteúdo estratégico — sem precisar saber design.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.a
              href="https://pay.kiwify.com.br/7b1lH1a"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg overflow-hidden"
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px hsl(var(--primary) / 0.5)" }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Shine sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                animate={{ x: ["-200%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              />
              <span className="relative z-10">Assinar Agora</span>
              <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </motion.a>
            <motion.a
              href="#features"
              className="flex items-center gap-2 px-8 py-4 rounded-xl border border-border/30 text-foreground font-medium hover:bg-secondary/30 transition-colors"
              whileHover={{ scale: 1.03, borderColor: "hsl(var(--primary) / 0.3)" }}
              whileTap={{ scale: 0.97 }}
            >
              Ver Ferramentas
            </motion.a>
          </motion.div>

          {/* Animated counters */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="mt-14 grid grid-cols-3 gap-6 max-w-lg mx-auto"
          >
            {[
              { value: 2500, suffix: "+", label: "Usuários Ativos" },
              { value: 50000, suffix: "+", label: "Imagens Criadas" },
              { value: 16, suffix: "+", label: "Ferramentas" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 md:py-32 px-6 relative z-10">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              16+ Ferramentas em{" "}
              <motion.span
                className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
                animate={{ backgroundPosition: ["0% center", "200% center"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                Um Só Lugar
              </motion.span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tudo que você precisa para criar conteúdo visual profissional.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((f, i) => (
              <TiltCard key={f.name} className="h-full">
                <motion.div
                  initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
                  variants={scaleIn} custom={i}
                  className="group relative p-5 rounded-2xl border border-border/20 bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 h-full"
                  whileHover={{ y: -4 }}
                >
                  <motion.span
                    className="text-3xl mb-3 block"
                    whileHover={{ scale: 1.3, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    {f.icon}
                  </motion.span>
                  <h3 className="font-semibold text-sm mb-1">{f.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/8 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 md:py-32 px-6 border-t border-border/10 relative z-10">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Como Funciona</h2>
            <p className="text-muted-foreground text-lg">Três passos para resultados profissionais.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            {[
              { step: "01", icon: <PenTool className="h-6 w-6" />, title: "Descreva", desc: "Escreva o que quer ou escolha um preset. A IA entende linguagem natural." },
              { step: "02", icon: <Wand2 className="h-6 w-6" />, title: "Gere", desc: "A IA cria sua imagem em segundos com qualidade profissional." },
              { step: "03", icon: <Zap className="h-6 w-6" />, title: "Refine", desc: "Ajuste cores, estilo e composição até ficar perfeito." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="relative text-center p-8 rounded-2xl border border-border/15 bg-card/20 backdrop-blur-sm"
                whileHover={{ y: -6, borderColor: "hsl(var(--primary) / 0.3)" }}
                transition={{ duration: 0.3 }}
              >
                <motion.span
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold bg-primary text-primary-foreground px-4 py-1.5 rounded-full"
                  animate={{ boxShadow: ["0 0 0px hsl(var(--primary)/0)", "0 0 15px hsl(var(--primary)/0.4)", "0 0 0px hsl(var(--primary)/0)"] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                >
                  Passo {s.step}
                </motion.span>
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  {s.icon}
                </motion.div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-20 md:py-32 px-6 border-t border-border/10 relative z-10 overflow-hidden">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              O Que Nossos Usuários{" "}
              <motion.span
                className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
                animate={{ backgroundPosition: ["0% center", "200% center"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                Dizem
              </motion.span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={scaleIn} custom={i}
                className="p-6 rounded-2xl border border-border/15 bg-card/30 backdrop-blur-sm relative overflow-hidden group"
                whileHover={{ y: -6, borderColor: "hsl(var(--primary) / 0.25)" }}
              >
                {/* Glow top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <motion.div key={j} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: j * 0.1 + i * 0.1 }}>
                      <Star className="h-4 w-4 fill-primary text-primary" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 md:py-32 px-6 border-t border-border/10 relative z-10">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Invista no Seu Conteúdo</h2>
            <p className="text-muted-foreground text-lg">Acesso completo a todas as ferramentas por um preço único.</p>
          </motion.div>

          <div className="max-w-md mx-auto">
            {plans.map((plan, i) => (
              <TiltCard key={plan.name}>
                <motion.div
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={scaleIn} custom={i}
                  className="relative p-8 rounded-2xl border border-primary/30 bg-card/40 backdrop-blur-sm shadow-2xl shadow-primary/10 overflow-hidden"
                >
                  {/* Animated border glow */}
                  <div className="relative z-10">
                    <motion.span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-full"
                      animate={{ boxShadow: ["0 0 0px hsl(var(--primary)/0)", "0 0 25px hsl(var(--primary)/0.5)", "0 0 0px hsl(var(--primary)/0)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ✨ Mais Popular
                    </motion.span>
                    <h3 className="font-bold text-xl mb-3 mt-2">{plan.name}</h3>
                    <div className="mb-6">
                      {plan.originalPrice && (
                        <span className="text-muted-foreground text-lg line-through mr-2">{plan.originalPrice}</span>
                      )}
                      <motion.span
                        className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {plan.price}
                      </motion.span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f, j) => (
                        <motion.li
                          key={f}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: j * 0.08 }}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {f}
                        </motion.li>
                      ))}
                    </ul>
                    <motion.a
                      href={plan.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block w-full py-4 rounded-xl font-semibold text-sm text-center bg-primary text-primary-foreground overflow-hidden"
                      whileHover={{ scale: 1.03, boxShadow: "0 0 35px hsl(var(--primary) / 0.5)" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                        animate={{ x: ["-200%", "200%"] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                      />
                      <span className="relative z-10">{plan.cta}</span>
                    </motion.a>
                  </div>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LEAD CAPTURE ─── */}
      <section className="py-20 px-6 border-t border-border/10 relative z-10">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Fique por Dentro das Novidades
          </h2>
          <p className="text-muted-foreground mb-8">
            Receba dicas, tutoriais e novos recursos antes de todo mundo.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) {
                setEmail("");
                alert("Obrigado! Você será notificado sobre novidades.");
              }
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="Seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-input border border-border/30 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
            <motion.button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all shrink-0"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px hsl(var(--primary) / 0.4)" }}
              whileTap={{ scale: 0.95 }}
            >
              Inscrever
            </motion.button>
          </form>
        </motion.div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 md:py-32 px-6 border-t border-border/10 relative z-10">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Perguntas Frequentes</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i * 0.15}
                className="rounded-xl border border-border/15 bg-card/20 backdrop-blur-sm overflow-hidden"
                whileHover={{ borderColor: "hsl(var(--primary) / 0.2)" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left group"
                >
                  <span className="font-medium text-sm pr-4 group-hover:text-primary transition-colors">{faq.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-5 pb-5">
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/10 py-12 px-6 relative z-10">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.05 }}>
            <img src={logo3d} alt="Design Master" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-bold">Design Master</span>
          </motion.div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {[
              { label: "Ferramentas", href: "#features" },
              { label: "Planos", href: "#pricing" },
              { label: "FAQ", href: "#faq" },
            ].map((link) => (
              <motion.a key={link.label} href={link.href} className="hover:text-foreground transition-colors" whileHover={{ y: -2 }}>
                {link.label}
              </motion.a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Design Master. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
