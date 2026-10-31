import { RawPaper } from '../types/index.ts';

/**
 * Seed benchmark dataset representing freshly published peer-reviewed AI/ML/CV/Soft Computing
 * papers and their referenced works. Provides instant offline rendering, fast tests,
 * and reliable demonstration without depending on OpenAlex network latency.
 */
export const SEED_RECENT_PAPERS: RawPaper[] = [
  {
    id: 'https://openalex.org/W440101',
    title: 'Self-Supervised Vision Representations with Diffusion Priors for Autonomous Driving',
    publication_date: '2026-10-27',
    publication_year: 2026,
    primary_topic: {
      id: 'T1',
      display_name: 'Computer Vision',
      subfield: { display_name: 'Computer Vision & Pattern Recognition' },
    },
    authorships: [
      { author: { id: 'A1', display_name: 'Zhiwei Chen' }, institutions: [{ display_name: 'Stanford University' }] },
      { author: { id: 'A2', display_name: 'Maya Lin' }, institutions: [{ display_name: 'UC Berkeley' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_ATTENTION',
      'https://openalex.org/W_RESNET',
      'https://openalex.org/W_CLIP',
      'https://openalex.org/W_LORA',
      'https://openalex.org/W_DDPM',
      'https://openalex.org/W_VIT',
      'https://openalex.org/W_DORMANT_GNN',
    ],
  },
  {
    id: 'https://openalex.org/W440102',
    title: 'Adaptive Neuro-Fuzzy Inference with Deep Residual Scaling for Complex Control Systems',
    publication_date: '2026-10-26',
    publication_year: 2026,
    primary_topic: {
      id: 'T2',
      display_name: 'Soft Computing',
      subfield: { display_name: 'Computational Intelligence & Fuzzy Systems' },
    },
    authorships: [
      { author: { id: 'A3', display_name: 'Elena Rostova' }, institutions: [{ display_name: 'ETH Zurich' }] },
      { author: { id: 'A4', display_name: 'Kenji Takahashi' }, institutions: [{ display_name: 'University of Tokyo' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_RESNET',
      'https://openalex.org/W_FUZZY_TAKAGI',
      'https://openalex.org/W_ADAM',
      'https://openalex.org/W_LORA',
      'https://openalex.org/W_DORMANT_FUZZY',
    ],
  },
  {
    id: 'https://openalex.org/W440103',
    title: 'Linear Attention State-Space Models for Edge-Device Video Segmentation',
    publication_date: '2026-10-26',
    publication_year: 2026,
    primary_topic: {
      id: 'T3',
      display_name: 'Computer Vision',
      subfield: { display_name: 'Computer Vision' },
    },
    authorships: [
      { author: { id: 'A5', display_name: 'Marcus Vance' }, institutions: [{ display_name: 'MIT CSAIL' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_MAMBA',
      'https://openalex.org/W_ATTENTION',
      'https://openalex.org/W_SAM',
      'https://openalex.org/W_VIT',
      'https://openalex.org/W_LORA',
      'https://openalex.org/W_DORMANT_GNN',
    ],
  },
  {
    id: 'https://openalex.org/W440104',
    title: 'Sparse Mixture-of-Experts Alignment via Preference Optimization',
    publication_date: '2026-10-25',
    publication_year: 2026,
    primary_topic: {
      id: 'T4',
      display_name: 'Machine Learning',
      subfield: { display_name: 'Artificial Intelligence' },
    },
    authorships: [
      { author: { id: 'A6', display_name: 'Sarah Goldberg' }, institutions: [{ display_name: 'Carnegie Mellon University' }] },
      { author: { id: 'A7', display_name: 'Devin Thorne' }, institutions: [{ display_name: 'Oxford University' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_DPO',
      'https://openalex.org/W_ATTENTION',
      'https://openalex.org/W_LORA',
      'https://openalex.org/W_SWITCH_TRANSFORMER',
      'https://openalex.org/W_ADAM',
    ],
  },
  {
    id: 'https://openalex.org/W440105',
    title: 'High-Fidelity Text-to-3D Synthesis with Multi-View Geometry and Latent Diffusion',
    publication_date: '2026-10-25',
    publication_year: 2026,
    primary_topic: {
      id: 'T1',
      display_name: 'Computer Vision',
      subfield: { display_name: 'Generative Computer Vision' },
    },
    authorships: [
      { author: { id: 'A8', display_name: 'Hao Zhang' }, institutions: [{ display_name: 'Tsinghua University' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_DDPM',
      'https://openalex.org/W_CLIP',
      'https://openalex.org/W_NERF',
      'https://openalex.org/W_ATTENTION',
      'https://openalex.org/W_3D_GAUSSIAN',
    ],
  },
  {
    id: 'https://openalex.org/W440106',
    title: 'Particle Swarm Optimization and Deep Reinforcement Learning for Dynamic Energy Grids',
    publication_date: '2026-10-24',
    publication_year: 2026,
    primary_topic: {
      id: 'T2',
      display_name: 'Soft Computing',
      subfield: { display_name: 'Evolutionary Computation & Swarm Intelligence' },
    },
    authorships: [
      { author: { id: 'A9', display_name: 'Amara Okafor' }, institutions: [{ display_name: 'Imperial College London' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_PSO_KENNEDY',
      'https://openalex.org/W_DQN_MNIH',
      'https://openalex.org/W_ADAM',
      'https://openalex.org/W_PPO_SCHULMAN',
      'https://openalex.org/W_DORMANT_FUZZY',
    ],
  },
  {
    id: 'https://openalex.org/W440107',
    title: 'Fast Segment Anything 2 in Medical Ultrasound Imaging',
    publication_date: '2026-10-24',
    publication_year: 2026,
    primary_topic: {
      id: 'T3',
      display_name: 'Computer Vision',
      subfield: { display_name: 'Medical Image Analysis' },
    },
    authorships: [
      { author: { id: 'A10', display_name: 'Lukas Meyer' }, institutions: [{ display_name: 'Technical University of Munich' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_SAM',
      'https://openalex.org/W_RESNET',
      'https://openalex.org/W_VIT',
      'https://openalex.org/W_LORA',
      'https://openalex.org/W_ATTENTION',
      'https://openalex.org/W_DORMANT_GNN',
    ],
  },
  {
    id: 'https://openalex.org/W440108',
    title: 'Selective State Space Models with Memory Decoupling for Long-Context Reasoning',
    publication_date: '2026-10-23',
    publication_year: 2026,
    primary_topic: {
      id: 'T4',
      display_name: 'Machine Learning',
      subfield: { display_name: 'Deep Learning Architectures' },
    },
    authorships: [
      { author: { id: 'A11', display_name: 'Ananya Sharma' }, institutions: [{ display_name: 'IIT Bombay' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_MAMBA',
      'https://openalex.org/W_ATTENTION',
      'https://openalex.org/W_LORA',
      'https://openalex.org/W_ADAM',
      'https://openalex.org/W_DORMANT_GNN',
    ],
  },
  {
    id: 'https://openalex.org/W440109',
    title: 'Gaussian Splatting for Photorealistic Novel View Reconstruction from Sparse Poses',
    publication_date: '2026-10-23',
    publication_year: 2026,
    primary_topic: {
      id: 'T1',
      display_name: 'Computer Vision',
      subfield: { display_name: '3D Computer Vision' },
    },
    authorships: [
      { author: { id: 'A12', display_name: 'Pierre Dubois' }, institutions: [{ display_name: 'INRIA' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_3D_GAUSSIAN',
      'https://openalex.org/W_NERF',
      'https://openalex.org/W_RESNET',
      'https://openalex.org/W_ATTENTION',
    ],
  },
  {
    id: 'https://openalex.org/W440110',
    title: 'Direct Preference Optimization with Negative Constraint Sampling in Language Agents',
    publication_date: '2026-10-22',
    publication_year: 2026,
    primary_topic: {
      id: 'T4',
      display_name: 'Machine Learning',
      subfield: { display_name: 'Reinforcement Learning from Human Feedback' },
    },
    authorships: [
      { author: { id: 'A13', display_name: 'Gabriel Morales' }, institutions: [{ display_name: 'University of Washington' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_DPO',
      'https://openalex.org/W_ATTENTION',
      'https://openalex.org/W_LORA',
      'https://openalex.org/W_PPO_SCHULMAN',
      'https://openalex.org/W_ADAM',
    ],
  },
  {
    id: 'https://openalex.org/W440111',
    title: 'Self-Balancing Genetic Algorithm with Type-2 Fuzzy Logic for Multi-Objective Scheduling',
    publication_date: '2026-10-22',
    publication_year: 2026,
    primary_topic: {
      id: 'T2',
      display_name: 'Soft Computing',
      subfield: { display_name: 'Evolutionary Optimization' },
    },
    authorships: [
      { author: { id: 'A14', display_name: 'Fatima Al-Mansoor' }, institutions: [{ display_name: 'KAUST' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_FUZZY_TAKAGI',
      'https://openalex.org/W_PSO_KENNEDY',
      'https://openalex.org/W_RESNET',
      'https://openalex.org/W_DORMANT_FUZZY',
    ],
  },
  {
    id: 'https://openalex.org/W440112',
    title: 'Zero-Shot Vision-Language Alignment with Contrastive Representation Learning',
    publication_date: '2026-10-21',
    publication_year: 2026,
    primary_topic: {
      id: 'T1',
      display_name: 'Computer Vision',
      subfield: { display_name: 'Multimodal Machine Learning' },
    },
    authorships: [
      { author: { id: 'A15', display_name: 'Chloe Laurent' }, institutions: [{ display_name: 'Sorbonne' }] },
    ],
    referenced_works: [
      'https://openalex.org/W_CLIP',
      'https://openalex.org/W_ATTENTION',
      'https://openalex.org/W_VIT',
      'https://openalex.org/W_LORA',
    ],
  },
];

/**
 * Seed repository of hydrated foundational and high-velocity papers.
 * Matches the referenced_works IDs in SEED_RECENT_PAPERS.
 */
export const SEED_HYDRATED_CITED_WORKS: Record<string, RawPaper> = {
  'https://openalex.org/W_ATTENTION': {
    id: 'https://openalex.org/W_ATTENTION',
    title: 'Attention Is All You Need',
    publication_date: '2017-06-12',
    publication_year: 2017,
    cited_by_count: 148500,
    primary_topic: {
      id: 'T_LLM',
      display_name: 'Deep Learning & Transformer Architectures',
      subfield: { display_name: 'Machine Learning' },
    },
    authorships: [
      { author: { id: 'A_V', display_name: 'Ashish Vaswani' } },
      { author: { id: 'A_S', display_name: 'Noam Shazeer' } },
      { author: { id: 'A_P', display_name: 'Niki Parmar' } },
      { author: { id: 'A_U', display_name: 'Jakob Uszkoreit' } },
    ],
    referenced_works: [],
    doi: '10.48550/arXiv.1706.03762',
    abstract: 'We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output.',
  },
  'https://openalex.org/W_LORA': {
    id: 'https://openalex.org/W_LORA',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    publication_date: '2021-10-16',
    publication_year: 2021,
    cited_by_count: 12400,
    primary_topic: {
      id: 'T_LORA',
      display_name: 'Parameter-Efficient Fine-Tuning (PEFT)',
      subfield: { display_name: 'Machine Learning' },
    },
    authorships: [
      { author: { id: 'A_HU', display_name: 'Edward J. Hu' } },
      { author: { id: 'A_SHEN', display_name: 'Yelong Shen' } },
      { author: { id: 'A_WALLIS', display_name: 'Phillip Wallis' } },
    ],
    referenced_works: [],
    doi: '10.48550/arXiv.2106.09685',
    abstract: 'We propose Low-Rank Adaptation (LoRA), which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture.',
  },
  'https://openalex.org/W_SAM': {
    id: 'https://openalex.org/W_SAM',
    title: 'Segment Anything',
    publication_date: '2023-04-05',
    publication_year: 2023,
    cited_by_count: 7850,
    primary_topic: {
      id: 'T_CV',
      display_name: 'Foundation Models for Computer Vision',
      subfield: { display_name: 'Computer Vision' },
    },
    authorships: [
      { author: { id: 'A_KIR', display_name: 'Alexander Kirillov' } },
      { author: { id: 'A_MINT', display_name: 'Eric Mintun' } },
      { author: { id: 'A_RAVI', display_name: 'Nikhila Ravi' } },
    ],
    referenced_works: [],
    doi: '10.1109/ICCV51070.2023.00371',
    abstract: 'We present the Segment Anything (SA) project: a new task, model, and dataset for image segmentation capable of zero-shot transfer to unfamiliar image distributions.',
  },
  'https://openalex.org/W_MAMBA': {
    id: 'https://openalex.org/W_MAMBA',
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
    publication_date: '2023-12-01',
    publication_year: 2023,
    cited_by_count: 3200,
    primary_topic: {
      id: 'T_SSM',
      display_name: 'Structured State Space Models (SSMs)',
      subfield: { display_name: 'Deep Learning' },
    },
    authorships: [
      { author: { id: 'A_GU', display_name: 'Albert Gu' } },
      { author: { id: 'A_DAO', display_name: 'Tri Dao' } },
    ],
    referenced_works: [],
    doi: '10.48550/arXiv.2312.00752',
    abstract: 'Mamba introduces a selective state space model architecture yielding linear-time inference and 5x higher throughput than standard Transformers on long sequences.',
  },
  'https://openalex.org/W_CLIP': {
    id: 'https://openalex.org/W_CLIP',
    title: 'Learning Transferable Visual Models From Natural Language Supervision (CLIP)',
    publication_date: '2021-02-26',
    publication_year: 2021,
    cited_by_count: 32800,
    primary_topic: {
      id: 'T_MM',
      display_name: 'Vision-Language Pretraining',
      subfield: { display_name: 'Computer Vision' },
    },
    authorships: [
      { author: { id: 'A_RAD', display_name: 'Alec Radford' } },
      { author: { id: 'A_KIM', display_name: 'Jong Wook Kim' } },
      { author: { id: 'A_HALL', display_name: 'Chris Hallacy' } },
    ],
    referenced_works: [],
    doi: '10.48550/arXiv.2103.00020',
    abstract: 'We demonstrate that the simple pre-training task of predicting which caption goes with which image achieves competitive zero-shot performance across dozens of computer vision benchmarks.',
  },
  'https://openalex.org/W_DPO': {
    id: 'https://openalex.org/W_DPO',
    title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model',
    publication_date: '2023-05-29',
    publication_year: 2023,
    cited_by_count: 4100,
    primary_topic: {
      id: 'T_RLHF',
      display_name: 'Direct Preference Optimization & Alignment',
      subfield: { display_name: 'Machine Learning' },
    },
    authorships: [
      { author: { id: 'A_RAF', display_name: 'Rafael Rafailov' } },
      { author: { id: 'A_SHAR', display_name: 'Archit Sharma' } },
      { author: { id: 'A_MIT', display_name: 'Eric Mitchell' } },
    ],
    referenced_works: [],
    doi: '10.48550/arXiv.2305.18290',
    abstract: 'Direct Preference Optimization (DPO) implicitly optimizes the exact same objective as RLHF without training a separate reward model or sampling from the LM during fine-tuning.',
  },
  'https://openalex.org/W_3D_GAUSSIAN': {
    id: 'https://openalex.org/W_3D_GAUSSIAN',
    title: '3D Gaussian Splatting for Real-Time Radiance Field Rendering',
    publication_date: '2023-07-28',
    publication_year: 2023,
    cited_by_count: 3950,
    primary_topic: {
      id: 'T_3D',
      display_name: 'Novel View Synthesis & Neural Rendering',
      subfield: { display_name: 'Computer Vision' },
    },
    authorships: [
      { author: { id: 'A_KER', display_name: 'Bernhard Kerbl' } },
      { author: { id: 'A_KOP', display_name: 'Georgios Kopanas' } },
      { author: { id: 'A_DRO', display_name: 'Thomas Leimkühler' } },
    ],
    referenced_works: [],
    doi: '10.1145/3592433',
    abstract: 'We introduce 3D Gaussian Splatting, achieving real-time novel view synthesis at 1080p resolution while matching or exceeding the visual quality of state-of-the-art NeRF methods.',
  },
  'https://openalex.org/W_RESNET': {
    id: 'https://openalex.org/W_RESNET',
    title: 'Deep Residual Learning for Image Recognition',
    publication_date: '2015-12-10',
    publication_year: 2016,
    cited_by_count: 215000,
    primary_topic: {
      id: 'T_RES',
      display_name: 'Deep Convolutional Networks',
      subfield: { display_name: 'Computer Vision' },
    },
    authorships: [
      { author: { id: 'A_HE', display_name: 'Kaiming He' } },
      { author: { id: 'A_ZHANG', display_name: 'Xiangyu Zhang' } },
      { author: { id: 'A_REN', display_name: 'Shaoqing Ren' } },
      { author: { id: 'A_SUN', display_name: 'Jian Sun' } },
    ],
    referenced_works: [],
    doi: '10.1109/CVPR.2016.90',
    abstract: 'We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously, reformulating layers as learning residual functions with reference to layer inputs.',
  },
  'https://openalex.org/W_FUZZY_TAKAGI': {
    id: 'https://openalex.org/W_FUZZY_TAKAGI',
    title: 'Fuzzy Identification of Systems and Its Applications to Modeling and Control',
    publication_date: '1985-01-01',
    publication_year: 1985,
    cited_by_count: 18900,
    primary_topic: {
      id: 'T_FUZZY',
      display_name: 'Takagi-Sugeno Fuzzy Control Systems',
      subfield: { display_name: 'Soft Computing' },
    },
    authorships: [
      { author: { id: 'A_TAKAGI', display_name: 'Tomohiro Takagi' } },
      { author: { id: 'A_SUGENO', display_name: 'Michio Sugeno' } },
    ],
    referenced_works: [],
    doi: '10.1109/TSMC.1985.6313399',
    abstract: 'A mathematical tool to build a fuzzy model of a system where input-output relations are expressed by implication propositions is presented and applied to complex nonlinear dynamics.',
  },
  'https://openalex.org/W_DDPM': {
    id: 'https://openalex.org/W_DDPM',
    title: 'Denoising Diffusion Probabilistic Models',
    publication_date: '2020-06-19',
    publication_year: 2020,
    cited_by_count: 24500,
    primary_topic: {
      id: 'T_DIFF',
      display_name: 'Diffusion Generative Models',
      subfield: { display_name: 'Machine Learning' },
    },
    authorships: [
      { author: { id: 'A_HO', display_name: 'Jonathan Ho' } },
      { author: { id: 'A_JAIN', display_name: 'Ajay Jain' } },
      { author: { id: 'A_ABBEEL', display_name: 'Pieter Abbeel' } },
    ],
    referenced_works: [],
    doi: '10.48550/arXiv.2006.11239',
    abstract: 'We present high quality image synthesis results using diffusion probabilistic models, a class of latent variable models trained with a weighted variational bound.',
  },
  'https://openalex.org/W_VIT': {
    id: 'https://openalex.org/W_VIT',
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
    publication_date: '2020-10-22',
    publication_year: 2020,
    cited_by_count: 51000,
    primary_topic: {
      id: 'T_VIT',
      display_name: 'Vision Transformers (ViT)',
      subfield: { display_name: 'Computer Vision' },
    },
    authorships: [
      { author: { id: 'A_DOSO', display_name: 'Alexey Dosovitskiy' } },
      { author: { id: 'A_BEYER', display_name: 'Lucas Beyer' } },
      { author: { id: 'A_KOLES', display_name: 'Alexander Kolesnikov' } },
    ],
    referenced_works: [],
    doi: '10.48550/arXiv.2010.11929',
    abstract: 'We show that a pure Transformer applied directly to sequences of image patches performs exceptionally well on image classification tasks when pre-trained on sufficient data.',
  },
  'https://openalex.org/W_ADAM': {
    id: 'https://openalex.org/W_ADAM',
    title: 'Adam: A Method for Stochastic Optimization',
    publication_date: '2014-12-22',
    publication_year: 2015,
    cited_by_count: 198000,
    primary_topic: {
      id: 'T_OPT',
      display_name: 'Optimization Algorithms in Deep Learning',
      subfield: { display_name: 'Machine Learning' },
    },
    authorships: [
      { author: { id: 'A_KINGMA', display_name: 'Diederik P. Kingma' } },
      { author: { id: 'A_BA', display_name: 'Jimmy Ba' } },
    ],
    referenced_works: [],
    doi: '10.48550/arXiv.1412.6980',
    abstract: 'We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions based on adaptive estimates of lower-order moments.',
  },
  'https://openalex.org/W_PSO_KENNEDY': {
    id: 'https://openalex.org/W_PSO_KENNEDY',
    title: 'Particle Swarm Optimization',
    publication_date: '1995-11-27',
    publication_year: 1995,
    cited_by_count: 89000,
    primary_topic: {
      id: 'T_PSO',
      display_name: 'Swarm Intelligence & Metaheuristics',
      subfield: { display_name: 'Soft Computing' },
    },
    authorships: [
      { author: { id: 'A_KEN', display_name: 'James Kennedy' } },
      { author: { id: 'A_EBER', display_name: 'Russell Eberhart' } },
    ],
    referenced_works: [],
    doi: '10.1109/ICNN.1995.488968',
    abstract: 'A concept for the optimization of nonlinear functions using particle swarm methodology inspired by social psychological behavior of bird flocking is introduced.',
  },
  'https://openalex.org/W_DORMANT_GNN': {
    id: 'https://openalex.org/W_DORMANT_GNN',
    title: 'Semi-Supervised Node Classification with Subgraph State-Space Embeddings',
    publication_date: '2016-04-12',
    publication_year: 2016,
    cited_by_count: 85,
    primary_topic: {
      id: 'T_DORMANT1',
      display_name: 'Graph Neural Networks & Relational Learning',
      subfield: { display_name: 'Machine Learning' },
    },
    authorships: [
      { author: { id: 'A_D1', display_name: 'Valentin Petrov' } },
      { author: { id: 'A_D2', display_name: 'Mira Kowalski' } },
    ],
    referenced_works: [],
    doi: '10.48550/arXiv.1604.03211',
    abstract: 'We formulate state-space graph convolutions for message passing over long-range dependencies, overcoming oversmoothing in dense topological networks.',
  },
  'https://openalex.org/W_DORMANT_FUZZY': {
    id: 'https://openalex.org/W_DORMANT_FUZZY',
    title: 'Hierarchical Neuro-Fuzzy State Representation for Stochastic Non-Stationary Control',
    publication_date: '2014-09-18',
    publication_year: 2014,
    cited_by_count: 110,
    primary_topic: {
      id: 'T_DORMANT2',
      display_name: 'Neuro-Fuzzy Systems & Adaptive Control',
      subfield: { display_name: 'Soft Computing' },
    },
    authorships: [
      { author: { id: 'A_D3', display_name: 'Stefan Lindqvist' } },
      { author: { id: 'A_D4', display_name: 'Hiroshi Tanaka' } },
    ],
    referenced_works: [],
    doi: '10.1109/TFUZZ.2014.235910',
    abstract: 'A hierarchical fuzzy partition framework for handling deep state spaces without combinatorial rule explosion in nonlinear adaptive control.',
  },
  'https://openalex.org/W_LATENT_SAFETY': {
    id: 'https://openalex.org/W_LATENT_SAFETY',
    title: 'Extreme Value Theory Formulations for Microscopic Trajectory Proximity in Surrogate Safety Measures',
    publication_date: '2008-05-14',
    publication_year: 2008,
    cited_by_count: 24,
    primary_topic: {
      id: 'T_TRANS1',
      display_name: 'Traffic Flow & Safety Analysis',
      subfield: { display_name: 'Transportation Engineering' },
    },
    authorships: [
      { author: { id: 'A_S1', display_name: 'David Westerman' } },
      { author: { id: 'A_S2', display_name: 'Arthur Pendelton' } },
    ],
    referenced_works: [],
    doi: '10.1016/j.aap.2008.03.012',
    abstract: 'A generalized Pareto formulation applied to vehicle post-encroachment time (PET) and time-to-collision (TTC) distributions, modeling rare crash events without multi-year crash records.',
  },
  'https://openalex.org/W_LATENT_TRAVEL': {
    id: 'https://openalex.org/W_LATENT_TRAVEL',
    title: 'Continuous-Time Markov Latent Activity Sequencing in Household Travel Survey Micro-Data',
    publication_date: '2011-11-20',
    publication_year: 2011,
    cited_by_count: 18,
    primary_topic: {
      id: 'T_TRANS2',
      display_name: 'Travel Behavior & Transportation Planning',
      subfield: { display_name: 'Transportation Engineering' },
    },
    authorships: [
      { author: { id: 'A_T1', display_name: 'Clara Van der Bilt' } },
      { author: { id: 'A_T2', display_name: 'Goran Lindholm' } },
    ],
    referenced_works: [],
    doi: '10.1016/j.trb.2011.08.005',
    abstract: 'Stochastic continuous-time transition matrices capturing chained trip purposes and intra-household joint activity patterns from stratified household travel surveys.',
  },
};

export function getAllCandidateHydratedWorks(): RawPaper[] {
  return Object.values(SEED_HYDRATED_CITED_WORKS);
}

/**
 * Service to execute the Inverted Index Pipeline either live from OpenAlex or via seed dataset.
 */
export async function fetchRecentPapersOpenAlex(
  lookbackDays: number = 7,
  politeEmail: string = 'saber.naseralavi@gmail.com',
  useLiveNetwork: boolean = false
): Promise<RawPaper[]> {
  if (!useLiveNetwork) {
    // Return benchmark seed data for instant response
    return SEED_RECENT_PAPERS;
  }

  const end = new Date();
  const start = new Date(end.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('filter', `from_publication_date:${startStr},to_publication_date:${endStr},concepts.id:C154945302|C119857082|C108827166,has_references:true`);
  url.searchParams.set('select', 'id,title,publication_date,publication_year,authorships,primary_topic,referenced_works,doi');
  url.searchParams.set('per-page', '50');
  url.searchParams.set('mailto', politeEmail);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err) {
    console.warn('Live OpenAlex fetch failed or timed out, using fallback benchmark dataset', err);
  }

  return SEED_RECENT_PAPERS;
}

/**
 * Hydrates full metadata for candidate works either from OpenAlex or from cached store.
 */
export async function hydrateWorksOpenAlex(
  workIds: string[],
  politeEmail: string = 'saber.naseralavi@gmail.com',
  useLiveNetwork: boolean = false
): Promise<RawPaper[]> {
  const resolved: RawPaper[] = [];
  const missingIds: string[] = [];

  for (const id of workIds) {
    if (SEED_HYDRATED_CITED_WORKS[id]) {
      resolved.push(SEED_HYDRATED_CITED_WORKS[id]);
    } else {
      missingIds.push(id);
    }
  }

  if (missingIds.length > 0 && useLiveNetwork) {
    try {
      const cleanIds = missingIds.map(id => id.split('/').pop()).filter(Boolean);
      const url = new URL('https://api.openalex.org/works');
      url.searchParams.set('filter', `openalex_id:${cleanIds.join('|')}`);
      url.searchParams.set('select', 'id,title,publication_year,publication_date,authorships,primary_topic,cited_by_count,doi,abstract_inverted_index');
      url.searchParams.set('mailto', politeEmail);

      const resp = await fetch(url.toString());
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.results)) {
          resolved.push(...data.results);
        }
      }
    } catch (e) {
      console.warn('Failed to hydrate missing works from OpenAlex live', e);
    }
  }

  return resolved;
}
