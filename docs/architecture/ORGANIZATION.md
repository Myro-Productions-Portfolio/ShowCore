# Architecture Documentation Organization

## Directory Structure

All architecture-related documentation and diagrams are now organized in `docs/architecture/`:

```
docs/
├── README.md                           # Documentation index
├── architecture/                       # Architecture documentation
│   ├── README.md                       # Architecture documentation index
│   ├── showcore_phase1_architecture.png    # Complete architecture diagram
│   ├── showcore_network_flow.png           # Network flow diagram
│   ├── ARCHITECTURE_OVERVIEW.md        # High-level overview
│   ├── ARCHITECTURE.md                 # Complete technical specs
│   ├── QUICK_REFERENCE.md              # Quick reference guide
│   ├── DIAGRAMS.md                     # Diagram documentation
│   ├── DIAGRAM_GENERATION_SUMMARY.md   # Generation summary
│   ├── DIAGRAM_CREATION_COMPLETE.md    # Completion summary
│   ├── create_architecture_diagram.py  # Diagram generator
│   └── create_network_flow_diagram.py  # Network flow generator
└── images/                             # Application screenshots
    ├── dashboard.png
    ├── login-page.png
    └── settings.png
```

## File Purposes

### Diagrams (PNG)
- **showcore_phase1_architecture.png** - Complete AWS infrastructure diagram
- **showcore_network_flow.png** - Network architecture and cost optimization

### Documentation (Markdown)
- **README.md** - Quick start and navigation
- **ARCHITECTURE_OVERVIEW.md** - Executive summary and key decisions
- **ARCHITECTURE.md** - Complete technical specifications
- **QUICK_REFERENCE.md** - Commands, costs, troubleshooting
- **DIAGRAMS.md** - How to regenerate diagrams
- **DIAGRAM_GENERATION_SUMMARY.md** - What was created and why
- **DIAGRAM_CREATION_COMPLETE.md** - Completion checklist

### Scripts (Python)
- **create_architecture_diagram.py** - Generates complete architecture diagram
- **create_network_flow_diagram.py** - Generates network flow diagram

## Infrastructure Directory

The `infrastructure/` directory is now clean and focused on CDK code:

```
infrastructure/
├── app.py                  # CDK app entry point
├── cdk.json                # CDK configuration
├── requirements.txt        # Python dependencies
├── requirements-dev.txt    # Dev dependencies
├── pytest.ini              # Test configuration
├── README.md               # Deployment guide
├── IMPLEMENTATION_NOTES.md # Implementation notes
├── lib/                    # CDK stacks and constructs
│   ├── stacks/             # Stack definitions
│   └── constructs/         # Reusable constructs
└── tests/                  # Unit, property, integration tests
    ├── unit/
    ├── property/
    └── integration/
```

## Accessing Documentation

### From Project Root
- Architecture docs: `docs/architecture/`
- Infrastructure code: `infrastructure/`
- Main README: `README.md`

### From GitHub
- Navigate to `docs/architecture/` to view diagrams and documentation
- Diagrams are displayed inline in GitHub

### Locally
- Open `docs/architecture/README.md` for navigation
- View PNG files in any image viewer
- Read markdown files in any text editor or markdown viewer

## Regenerating Diagrams

```bash
# From project root
python docs/architecture/create_architecture_diagram.py
python docs/architecture/create_network_flow_diagram.py

# Move generated files (they're created in current directory)
move showcore_phase1_architecture.png docs/architecture/
move showcore_network_flow.png docs/architecture/
```

## Benefits of This Organization

### Clear Separation
- **docs/** - All documentation and diagrams
- **infrastructure/** - Only CDK code and deployment configs

### Easy Navigation
- Single location for all architecture docs
- Clear hierarchy and purpose
- README files at each level

### Version Control
- Diagrams and docs together
- Easy to track changes
- Clear commit history

### Maintainability
- Easy to find and update
- Scripts co-located with outputs
- Documentation stays in sync

## Related Documentation

- [Project README](../../README.md) - Main project documentation
- [Infrastructure README](../../infrastructure/README.md) - CDK deployment guide
- [Architecture Overview](ARCHITECTURE_OVERVIEW.md) - High-level summary
