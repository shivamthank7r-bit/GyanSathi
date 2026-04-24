import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SUBJECTS = [
  { 
    id: 'general', 
    name: 'General', 
    icon: 'Sparkles', 
    color: 'bg-blue-600', 
    description: 'General academic help and study tips.',
    prompt: 'You are a general academic assistant. Help students with study tips, general knowledge, and memory improvement techniques.' 
  },
  { 
    id: 'math', 
    name: 'Maths', 
    icon: 'Calculator', 
    color: 'bg-blue-500', 
    description: 'Solve complex algebra, geometry proofs, comprehensive calculus, and statistical data analysis. Get clear step-by-step guidance for competitive exams like SEE, NEB, or CBSE.',
    prompt: 'You are an expert Math tutor. Provide step-by-step solutions with clear explanations and formulas using LaTeX.' 
  },
  { 
    id: 'physics', 
    name: 'Physics', 
    icon: 'Zap', 
    color: 'bg-purple-500', 
    description: 'Understand the laws of the universe. From Newtonian mechanics and thermodynamics to electromagnetism and modern quantum physics with real-world examples.',
    prompt: 'You are an expert Physics professor. Explain concepts and solve problems using physics principles and clear step-by-step math.' 
  },
  { 
    id: 'chemistry', 
    name: 'Chemistry', 
    icon: 'Beaker', 
    color: 'bg-red-500', 
    description: 'Explore the world of atoms and molecules. Help with organic reactions, stoichiometry, periodic table trends, and chemical bonding mechanisms.',
    prompt: 'You are an expert Chemistry teacher. Explain chemical reactions, periodic table concepts, and molecular structures clearly.' 
  },
  { 
    id: 'biology', 
    name: 'Biology', 
    icon: 'Dna', 
    color: 'bg-green-500', 
    description: 'Dive into the science of life. Detailed explanations of human anatomy, genetics, plant physiology, ecology, and cellular processes with descriptive insights.',
    prompt: 'You are an expert Biologist. Explain biological concepts, diagrams, and processes with detailed descriptions.' 
  },
  { 
    id: 'english', 
    name: 'English', 
    icon: 'Book', 
    color: 'bg-indigo-500', 
    description: 'Master the English language. Get help with literature analysis (poems, stories), complex grammar patterns, and professional essay or creative writing.',
    prompt: 'You are an expert English language tutor. Help with grammar, literature analysis, and creative writing.' 
  },
  { 
    id: 'nepali', 
    name: 'Nepali', 
    icon: 'Languages', 
    color: 'bg-cyan-500', 
    description: 'नेपाली व्याकरण (Byakaran), साहित्य (Shahitya) र निबन्ध लेखनमा पूर्ण सहयोग। SEE र NEB पाठ्यक्रममा आधारित प्रश्नहरू हल गर्नुहोस्।',
    prompt: 'तपाईं एक नेपाली भाषा विशेषज्ञ हुनुहुन्छ। नेपाली व्याकरण, साहित्य र अनुवादमा मद्दत गर्नुहोस्।' 
  },
  { 
    id: 'hindi', 
    name: 'Hindi', 
    icon: 'Type', 
    color: 'bg-orange-500', 
    description: 'हिंदी व्याकरण, पद्य-गद्य व्याख्या और पत्र लेखन में विशेषज्ञता। भाषा को गहराई से समझने और परीक्षा की तैयारी में सहायता पाएँ।',
    prompt: 'आप एक हिंदी भाषा विशेषज्ञ हैं। हिंदी व्याकरण, साहित्य और अनुवाद में सहायता करें।' 
  },
];
