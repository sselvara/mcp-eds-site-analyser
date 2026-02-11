# Website Template Mapping Diagram

## Template Hierarchy and Component Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           [WEBSITE NAME] TEMPLATES                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  [TEMPLATE 1]   │    │  [TEMPLATE 2]   │    │  [TEMPLATE 3]   │
│  ([X] pages)    │    │  ([X] pages)    │    │  ([X] pages)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ • [Component 1] │    │ • [Component 1] │    │ • [Component 1] │
│ • [Component 2] │    │ • [Component 2] │    │ • [Component 2] │
│ • [Component 3] │    │ • [Component 3] │    │ • [Component 3] │
│ • [Component 4] │    │ • [Component 4] │    │ • [Component 4] │
│ • [Component 5] │    │ • [Component 5] │    │ • [Component 5] │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  [TEMPLATE 4]   │    │  [TEMPLATE 5]   │    │  [TEMPLATE 6]   │
│  ([X] pages)    │    │  ([X] pages)    │    │  ([X] pages)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ • [Component 1] │    │ • [Component 1] │    │ • [Component 1] │
│ • [Component 2] │    │ • [Component 2] │    │ • [Component 2] │
│ • [Component 3] │    │ • [Component 3] │    │ • [Component 3] │
│ • [Component 4] │    │ • [Component 4] │    │ • [Component 4] │
│ • [Component 5] │    │ • [Component 5] │    │ • [Component 5] │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUB-TEMPLATES ([X]+ pages)                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ [SUBTEMPLATE 1] │    │ [SUBTEMPLATE 2] │    │ [SUBTEMPLATE 3] │
│ ([X]+ pages)    │    │ ([X]+ pages)    │    │ ([X]+ pages)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ • [Component 1] │    │ • [Component 1] │    │ • [Component 1] │
│ • [Component 2] │    │ • [Component 2] │    │ • [Component 2] │
│ • [Component 3] │    │ • [Component 3] │    │ • [Component 3] │
│ • [Component 4] │    │ • [Component 4] │    │ • [Component 4] │
│ • [Component 5] │    │ • [Component 5] │    │ • [Component 5] │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐
│ [SUBTEMPLATE 4] │
│ ([X]+ pages)    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ • [Component 1] │
│ • [Component 2] │
│ • [Component 3] │
│ • [Component 4] │
│ • [Component 5] │
└─────────────────┘
```

## Component Reuse Matrix

### High Reuse Components (Used in 4+ Templates)
```
┌─────────────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Component       │[T1] │[T2] │[T3] │[T4] │[T5] │[T6] │[T7] │
├─────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ [Component A]   │ ❌  │ ✅  │ ✅  │ ✅  │ ✅  │ ✅  │ ✅  │
│ [Component B]   │ ✅  │ ✅  │ ✅  │ ❌  │ ❌  │ ❌  │ ✅  │
│ [Component C]   │ ✅  │ ✅  │ ✅  │ ❌  │ ❌  │ ❌  │ ✅  │
│ [Component D]   │ ❌  │ ✅  │ ✅  │ ❌  │ ✅  │ ✅  │ ❌  │
└─────────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

### Template-Specific Components
```
┌─────────────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Unique Component│[T1] │[T2] │[T3] │[T4] │[T5] │[T6] │[T7] │
├─────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ [Unique Comp 1] │ ✅  │ ❌  │ ❌  │ ❌  │ ❌  │ ❌  │ ❌  │
│ [Unique Comp 2] │ ❌  │ ❌  │ ❌  │ ❌  │ ❌  │ ✅  │ ❌  │
│ [Unique Comp 3] │ ❌  │ ❌  │ ❌  │ ✅  │ ❌  │ ❌  │ ❌  │
│ [Unique Comp 4] │ ❌  │ ❌  │ ❌  │ ❌  │ ✅  │ ❌  │ ❌  │
│ [Unique Comp 5] │ ❌  │ ❌  │ ❌  │ ❌  │ ❌  │ ❌  │ ✅  │
└─────────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

## Development Priority Matrix

### Phase 1: Core Components (Weeks 1-4)
```
Priority: HIGH REUSABILITY
┌─────────────────────────────────────────────────────────────┐
│ • [Core Component 1] ([X]/[Y] templates)                    │
│ • [Core Component 2] ([X]/[Y] templates)                    │
│ • [Core Component 3] ([X]/[Y] templates)                    │
│ • [Core Component 4] ([X]/[Y] templates)                    │
│ • [Core Component 5] ([X]/[Y] templates)                    │
│ • [Core Component 6] ([X]/[Y] templates)                    │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Specialized Components (Weeks 5-8)
```
Priority: MEDIUM REUSABILITY
┌─────────────────────────────────────────────────────────────┐
│ • [Specialized Component 1] ([Template] only)               │
│ • [Specialized Component 2] ([Template] only)               │
│ • [Specialized Component 3] ([Template] only)               │
│ • [Specialized Component 4] ([Template] only)               │
│ • [Specialized Component 5] ([Template] only)               │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Advanced Components (Weeks 9-12)
```
Priority: COMPLEX INTEGRATIONS
┌─────────────────────────────────────────────────────────────┐
│ • [Advanced Component 1] ([Template] only)                  │
│ • [Advanced Component 2] ([Template] only)                  │
│ • [Advanced Component 3] ([Template] only)                  │
│ • [Advanced Component 4] ([Template] only)                  │
│ • [Advanced Component 5] ([Template] only)                  │
└─────────────────────────────────────────────────────────────┘
```

## Template Rationale Summary

### Why This Template Structure Works:

1. **Scalability**: Easy to add new pages using existing templates
2. **Consistency**: Standardized user experience across all sections
3. **Maintainability**: Centralized component updates affect multiple pages
4. **Performance**: Shared components can be cached and optimized
5. **Content Management**: Clear template patterns for content editors

### Development Efficiency Gains:

- **[X]% Time Savings**: Through component reuse
- **Reduced Testing**: Tested components work across multiple templates
- **Faster Iterations**: Template changes propagate to all related pages
- **Better Quality**: Proven components reduce bugs and inconsistencies

### Risk Mitigation:

- **Template-Specific Risks**: Isolated to individual templates
- **Component Dependencies**: Clear dependency mapping
- **Rollback Strategy**: Template-level rollbacks possible
- **Performance Monitoring**: Template-specific performance tracking

## Usage Instructions

### How to Use This Template:

1. **Replace Placeholders**:
   - `[WEBSITE NAME]` → Your website/project name
   - `[TEMPLATE X]` → Your specific template names
   - `[Component X]` → Your specific component names
   - `[X]` → Actual numbers (page counts, percentages, etc.)

2. **Customize Structure**:
   - Add or remove template boxes as needed
   - Adjust component lists per template
   - Modify development phases based on your timeline

3. **Update Matrices**:
   - Fill in component reuse patterns
   - Mark template-specific components
   - Adjust priority phases based on your requirements

4. **Tailor Rationale**:
   - Update efficiency gains with your specific metrics
   - Customize risk mitigation strategies
   - Add project-specific considerations

### Template Variables Reference:

- **Templates**: Main page types in your website
- **Sub-templates**: Secondary page types or variations
- **Components**: Reusable UI elements within templates
- **Reuse Matrix**: Shows which components are used across templates
- **Development Phases**: Prioritized implementation timeline
- **Efficiency Metrics**: Quantified benefits of the template approach

**NOTE: This is an AI-driven experience, and while we strive for accuracy, AI may sometimes generate unexpected or imperfect responses.**