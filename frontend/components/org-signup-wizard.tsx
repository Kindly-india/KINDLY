"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  Building2,
  Users,
  Heart,
  User,
  Upload,
  Check,
  Clock,
  Sparkles,
  Star,
  Shield,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

type OrgType = "registered" | "supported" | "informal" | "individual" | null
type ViewState = "category" | "form" | "success"

interface OrgSignupWizardProps {
  onBack?: () => void
}

const orgTypes = [
  {
    id: "registered" as const,
    title: "Registered Organisation",
    description: "NGO, Trust, or Society with legal registration",
    icon: Building2,
    color: "from-[#3b82f6] to-[#2563eb]",
    bgColor: "from-[#eff6ff] to-[#dbeafe]",
  },
  {
    id: "supported" as const,
    title: "Supported Organisation",
    description: "College club or corporate CSR team",
    icon: Users,
    color: "from-[#8b5cf6] to-[#7c3aed]",
    bgColor: "from-[#f5f3ff] to-[#ede9fe]",
  },
  {
    id: "informal" as const,
    title: "Informal Group",
    description: "Community group or friend circle",
    icon: Heart,
    color: "from-[#f59e0b] to-[#d97706]",
    bgColor: "from-[#fffbeb] to-[#fef3c7]",
  },
  {
    id: "individual" as const,
    title: "Individual Organizer",
    description: "Solo changemaker hosting events",
    icon: User,
    color: "from-[#10b981] to-[#059669]",
    bgColor: "from-[#f0fdf4] to-[#dcfce7]",
  },
]

export function OrgSignupWizard({ onBack }: OrgSignupWizardProps) {
  const router = useRouter()
  const handleExit = onBack ?? (() => router.push("/"))
  const [currentView, setCurrentView] = useState<ViewState>("category")
  const [selectedOrg, setSelectedOrg] = useState<OrgType>(null)
  const [registrationType, setRegistrationType] = useState<string>("ngo")
  const [uploadedFiles, setUploadedFiles] = useState<{
    registrationCertificate?: string;
    panCard?: string;
    proofDocument?: string;
  }>({});
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    // Client-side validation (all org types) — the backend requires these, and
    // without this a blank submit returns a cryptic 400. Toasts, not the browser's
    // native popups, to match the rest of the app.
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim();

    if (!name || !email || !phone) {
      toast.error('Please fill in your name, email, and phone number.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: any = {
        orgType: selectedOrg,
        name,
        email,
        phone,
      };

      // Add conditional fields based on org type
      if (selectedOrg === 'registered') {
        data.registrationType = registrationType;
        data.registrationNumber = formData.get('registrationNumber') as string;
        data.representativeName = formData.get('representativeName') as string;
        data.designation = formData.get('designation') as string;
        // Only send website if the user actually entered one — an empty string
        // fails the backend's @IsUrl() (which @IsOptional doesn't skip for '').
        const website = (formData.get('website') as string)?.trim();
        if (website) data.website = website;
        data.registrationCertificateUrl = uploadedFiles.registrationCertificate;
        data.panCardUrl = uploadedFiles.panCard;
      } else if (selectedOrg === 'supported') {
        data.parentInstitution = formData.get('parentInstitution') as string;
        data.coordinatorName = formData.get('coordinatorName') as string;
        data.proofDocumentUrl = uploadedFiles.proofDocument;
      } else if (selectedOrg === 'informal') {
        data.areaLocality = formData.get('areaLocality') as string;
        data.proofDocumentUrl = uploadedFiles.proofDocument;
      } else if (selectedOrg === 'individual') {
        data.intentDescription = formData.get('intentDescription') as string;
      }

      await api.signupOrganization(data);
      setCurrentView('success');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    fileType: 'registrationCertificate' | 'panCard' | 'proofDocument'
  ) => {
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and image files (JPG, PNG) are allowed');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedOrg}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store the object PATH, not a public URL — the bucket is private and the
      // backend hands admins a signed URL from this path during review.
      setUploadedFiles(prev => ({ ...prev, [fileType]: filePath }));
      toast.success('File uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Category Selection View
  if (currentView === "category") {
    return (
      <section className="min-h-screen bg-gradient-to-b from-[#fef7f0] dark:from-[#fef7f0]/10 via-white dark:via-background to-[#f0fdf4] dark:to-[#f0fdf4]/10 relative overflow-x-hidden">
        {/* Header - only visible on mobile */}
        <header className="md:hidden pt-4 pb-3 text-center px-4">
          <div></div>
        </header>

        {/* ✅ UPDATED: Floating Icons are now hidden on small screens and pushed behind (z-0) */}
        <div className="hidden lg:flex absolute top-28 left-10 xl:left-20 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-0">
          <Building2 className="w-7 h-7 text-[#3b82f6]" />
        </div>
        <div className="hidden lg:flex absolute top-40 right-10 xl:right-24 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-0">
          <Sparkles className="w-7 h-7 text-[#f59e0b]" />
        </div>
        <div className="hidden lg:flex absolute bottom-40 left-10 xl:left-32 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-0">
          <Users className="w-7 h-7 text-[#8b5cf6]" />
        </div>
        <div className="hidden lg:flex absolute bottom-32 right-10 xl:right-40 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-0">
          <Star className="w-7 h-7 text-[#10b981]" />
        </div>

        <div className="mt-3 flex items-start md:items-center justify-center px-4 md:px-6 pt-2 md:pt-24 pb-8 md:pb-20">
          <div className="w-full max-w-sm md:max-w-lg relative">
            {/* Decorative blur elements */}
            <div className="absolute -top-8 -left-8 md:-top-10 md:-left-10 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-[#ffecd2]/40 dark:from-[#ffecd2]/10 to-[#fcb69f]/40 dark:to-[#fcb69f]/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -right-8 md:-bottom-10 md:-right-10 w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-[#a8edea]/40 dark:from-[#a8edea]/10 to-[#fed6e3]/40 dark:to-[#fed6e3]/10 rounded-full blur-2xl" />

            {/* ✅ UPDATED: Added z-20 so the card is always above decorative icons */}
            <Card className="relative z-20 md:rounded-3xl p-5 md:p-10 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)]">
              {/* Back button */}
              <button
                onClick={handleExit}
                className="absolute top-4 left-4 md:top-6 md:left-6 text-muted-foreground hover:text-foreground transition-colors text-[13px] flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back
              </button>

              <h1 className="text-[22px] md:text-[32px] font-semibold text-foreground tracking-tight text-center mt-8 md:mt-0">
                What describes you best?
              </h1>
              <p className="text-[13px] md:text-[17px] text-muted-foreground text-center mt-1.5 md:mt-3 mb-5 md:mb-8">
                Select your organization type to continue
              </p>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {orgTypes.map((org) => {
                  const Icon = org.icon
                  const isSelected = selectedOrg === org.id
                  return (
                    <button
                      key={org.id}
                      onClick={() => setSelectedOrg(org.id)}
                      className={cn(
                        "relative p-4 md:p-5 rounded-2xl text-left transition-all duration-300 border-2",
                        isSelected
                          ? "border-[#ff6b6b] bg-gradient-to-br from-[#fff5f5] dark:from-[#fff5f5]/10 to-[#ffe8e8] dark:to-[#ffe8e8]/10 shadow-lg"
                          : "border-transparent bg-muted hover:bg-[#ebebed]",
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br",
                          org.bgColor,
                        )}
                      >
                        <Icon
                          className="w-5 h-5 md:w-6 md:h-6"
                          style={{
                            color: org.color.includes("3b82f6")
                              ? "#3b82f6"
                              : org.color.includes("8b5cf6")
                                ? "#8b5cf6"
                                : org.color.includes("f59e0b")
                                  ? "#f59e0b"
                                  : "#10b981",
                          }}
                        />
                      </div>
                      <h3 className="text-[14px] md:text-[15px] font-semibold text-foreground mb-1 leading-tight">
                        {org.title}
                      </h3>
                      <p className="text-[12px] text-muted-foreground leading-snug line-clamp-2">
                        {org.description}
                      </p>
                    </button>
                  )
                })}
              </div>

              <Button
                onClick={() => selectedOrg && setCurrentView("form")}
                disabled={!selectedOrg}
                className="w-full h-12 bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] hover:from-[#ff5252] hover:to-[#e04848] text-white text-[15px] md:text-[17px] font-medium rounded-full mt-5 md:mt-6 disabled:opacity-50 shadow-lg shadow-[#ff6b6b]/25"
              >
                Continue
              </Button>

              <p className="text-center mt-5 md:mt-6 text-[12px] md:text-[13px] text-muted-foreground">
                Already registered?{" "}
                <Link href="/" className="text-[#ff6b6b] hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </Card>
          </div>
        </div>
      </section>
    )
  }

  // Success View
  if (currentView === "success") {
    return (
      <section className="min-h-screen bg-gradient-to-b from-[#fef7f0] dark:from-[#fef7f0]/10 via-white dark:via-background to-[#f0fdf4] dark:to-[#f0fdf4]/10 flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-20 relative overflow-x-hidden">
        {/* ✅ UPDATED: Floating Icons pushed behind and moved */}
        <div className="hidden lg:flex absolute top-24 left-10 xl:left-24 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-0">
          <Check className="w-7 h-7 text-[#10b981]" />
        </div>
        <div className="hidden lg:flex absolute top-32 right-10 xl:right-28 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-0">
          <Sparkles className="w-7 h-7 text-[#f59e0b]" />
        </div>

        <div className="w-full max-w-sm md:max-w-md relative">
          <div className="absolute -top-8 -left-8 md:-top-10 md:-left-10 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#ffecd2]/40 dark:from-[#ffecd2]/10 to-[#fcb69f]/40 dark:to-[#fcb69f]/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -right-8 md:-bottom-10 md:-right-10 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#a8edea]/40 dark:from-[#a8edea]/10 to-[#fed6e3]/40 dark:to-[#fed6e3]/10 rounded-full blur-2xl" />

          {/* ✅ UPDATED: Added z-20 */}
          <Card className="relative z-20 md:rounded-3xl p-6 md:p-12 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)] text-center">
            <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-[#fef3c7] to-[#fde68a] flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 md:w-12 md:h-12 text-[#f59e0b]" />
            </div>

            <h1 className="text-[22px] md:text-[32px] font-semibold text-foreground tracking-tight mb-2 md:mb-3">
              Application Submitted!
            </h1>
            <p className="text-[13px] md:text-[17px] text-muted-foreground mb-5 md:mb-8">
              We're reviewing your details. You'll hear from us within 24-48 hours.
            </p>

            <div className="bg-muted rounded-xl md:rounded-2xl p-4 md:p-6 mb-5 md:mb-8">
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
                <Shield className="w-4 h-4 md:w-5 md:h-5 text-[#3b82f6]" />
                <span className="text-[12px] md:text-[15px] font-medium text-foreground">Verification in Progress</span>
              </div>
              <p className="text-[10px] md:text-[13px] text-muted-foreground">
                Our team is verifying your documents and information to ensure a safe community.
              </p>
            </div>

            <Link href="/signup">
              <Button variant="nav-pill" className="w-full h-10 md:h-12 bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] hover:from-[#ff5252] hover:to-[#e04848] text-white text-[13px] md:text-[17px] font-medium shadow-lg shadow-[#ff6b6b]/25">
                Back to Home
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    )
  }

  // Form View
  const selectedOrgData = orgTypes.find((o) => o.id === selectedOrg)

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#fef7f0] dark:from-[#fef7f0]/10 via-white dark:via-background to-[#f0fdf4] dark:to-[#f0fdf4]/10 relative overflow-x-hidden">
      {/* Header - only visible on mobile */}
      <header className="md:hidden pt-4 pb-3 text-center px-4">
        <Link href="/" className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#1d1d1f] dark:bg-white/10">
          <Image src="/logowhite.png" alt="KINDLY" width={188} height={44} className="h-4 w-auto" />
        </Link>
      </header>

      {/* ✅ UPDATED: Floating Icons pushed behind and moved */}
      <div className="hidden lg:flex absolute top-28 left-10 xl:left-20 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-0">
        {selectedOrgData && (
          <selectedOrgData.icon
            className="w-7 h-7"
            style={{
              color: selectedOrgData.color.includes("3b82f6")
                ? "#3b82f6"
                : selectedOrgData.color.includes("8b5cf6")
                  ? "#8b5cf6"
                  : selectedOrgData.color.includes("f59e0b")
                    ? "#f59e0b"
                    : "#10b981",
            }}
          />
        )}
      </div>
      <div className="hidden lg:flex absolute top-40 right-10 xl:right-24 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-0">
        <Sparkles className="w-7 h-7 text-[#f59e0b]" />
      </div>
      <div className="hidden lg:flex absolute bottom-32 right-10 xl:right-40 w-14 h-14 rounded-2xl bg-card shadow-lg items-center justify-center z-0">
        <Star className="w-7 h-7 text-[#10b981]" />
      </div>

      <div className="flex items-start justify-center px-4 md:px-6 pt-2 md:pt-24 pb-8 md:pb-20">
        <div className="w-full max-w-sm md:max-w-lg relative">
          <div className="absolute -top-8 -left-8 md:-top-10 md:-left-10 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-[#ffecd2]/40 dark:from-[#ffecd2]/10 to-[#fcb69f]/40 dark:to-[#fcb69f]/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -right-8 md:-bottom-10 md:-right-10 w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-[#a8edea]/40 dark:from-[#a8edea]/10 to-[#fed6e3]/40 dark:to-[#fed6e3]/10 rounded-full blur-2xl" />

          {/* ✅ UPDATED: Added z-20 */}
          <Card className="relative z-20 md:rounded-3xl p-5 md:p-10 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.1)]">
            {/* Back button */}
            <button
              onClick={() => setCurrentView("category")}
              className="absolute top-4 left-4 md:top-6 md:left-6 text-muted-foreground hover:text-foreground transition-colors text-[12px] md:text-[13px] flex items-center gap-1"
            >
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 rotate-180" />
              Back
            </button>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-4 md:mb-6 mt-4 md:mt-0">
              <div className="w-6 md:w-8 h-1 md:h-1.5 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a]" />
              <div className="w-6 md:w-8 h-1 md:h-1.5 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a]" />
              <div className="w-6 md:w-8 h-1 md:h-1.5 rounded-full bg-border" />
            </div>

            <h1 className="text-[18px] md:text-[28px] font-semibold text-foreground tracking-tight text-center">
              {selectedOrgData?.title}
            </h1>
            <p className="text-[11px] md:text-[15px] text-muted-foreground text-center mt-1 md:mt-2 mb-4 md:mb-8">
              Tell us more about your organization
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
              {selectedOrg === "registered" && (
                <>
                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Legal Organisation Name</Label>
                    <Input
                      name="name"
                      placeholder="Green Earth Foundation"

                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Email</Label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="contact@organisation.org"

                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    />
                  </div>


                  <div className="space-y-1.5 md:space-y-3">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Registration Type</Label>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {["NGO", "Trust", "Society", "Section 8"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setRegistrationType(type.toLowerCase())}
                          className={cn(
                            "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[11px] md:text-[14px] font-medium transition-all",
                            registrationType === type.toLowerCase()
                              ? "bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-md"
                              : "bg-muted text-muted-foreground hover:bg-[#ebebed]",
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Registration Number <span className="text-muted-foreground">(Optional)</span></Label>
                    <Input
                      name="registrationNumber"
                      placeholder="MH/2024/12345"

                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Representative Name <span className="text-muted-foreground">(Optional)</span></Label>
                      <Input
                        name="representativeName"
                        placeholder="John Doe"

                        className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                      />
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Designation <span className="text-muted-foreground">(Optional)</span></Label>
                      <Input
                        name="designation"
                        placeholder="Director"

                        className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Phone Number</Label>
                    <div className="flex gap-1.5 md:gap-2">
                      <div className="h-10 md:h-14 px-3 md:px-4 bg-muted rounded-lg md:rounded-xl flex items-center text-muted-foreground text-[12px] md:text-[15px] font-medium shrink-0">
                        +91
                      </div>
                      <Input
                        name="phone"
                        type="tel"
                        placeholder="9876543210"

                        pattern="[0-9]{10}"
                        className="flex-1 h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Website or Social Link <span className="text-muted-foreground">(Optional)</span></Label>
                    <Input
                      name="website"
                      placeholder="https://yourorganisation.org"
                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">
                      Upload Registration Certificate <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg md:rounded-xl p-4 md:p-6 text-center bg-gradient-to-br from-[#eff6ff]/50 dark:from-[#eff6ff]/10 to-[#dbeafe]/50 dark:to-[#dbeafe]/10 hover:border-[#3b82f6] transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="registrationCertificate"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'registrationCertificate');
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor="registrationCertificate" className="cursor-pointer">
                        {uploadedFiles.registrationCertificate ? (
                          <div className="text-[#10b981]">
                            <Check className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                            <p className="text-[11px] md:text-[13px]">File uploaded successfully!</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[#3b82f6]" />
                            <p className="text-[11px] md:text-[13px] text-muted-foreground">
                              {uploading ? 'Uploading...' : 'Click to upload PDF or image'}
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">
                      Upload PAN Card <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg md:rounded-xl p-3 md:p-4 text-center bg-muted/50 hover:border-[#3b82f6] transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="panCard"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'panCard');
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor="panCard" className="cursor-pointer">
                        {uploadedFiles.panCard ? (
                          <div className="text-[#10b981]">
                            <Check className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1" />
                            <p className="text-[10px] md:text-[12px]">Uploaded!</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-[10px] md:text-[12px] text-muted-foreground">
                              {uploading ? 'Uploading...' : 'Click to upload'}
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </>
              )}

              {selectedOrg === "supported" && (
                <>
                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Club / Team Name</Label>
                    <Input
                      name="name"
                      placeholder="NSS Unit, ABC College"

                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Parent Institution <span className="text-muted-foreground">(Optional)</span></Label>
                    <Input
                      name="parentInstitution"
                      placeholder="ABC Engineering College"

                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Coordinator Name <span className="text-muted-foreground">(Optional)</span></Label>
                    <Input
                      name="coordinatorName"

                      placeholder="Prof. Sharma"
                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Coordinator Email</Label>
                    <Input
                      name="email"

                      type="email"
                      placeholder="coordinator@college.edu"
                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                    />
                  </div>


                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">
                      Coordinator Phone Number
                    </Label>
                    <div className="flex gap-1.5 md:gap-2">
                      <div className="h-10 md:h-14 px-3 md:px-4 bg-muted rounded-lg md:rounded-xl flex items-center text-muted-foreground text-[12px] md:text-[15px] font-medium shrink-0">
                        +91
                      </div>
                      <Input
                        name="phone"

                        type="tel"
                        placeholder="9876543210"
                        className="flex-1 h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">
                      Upload Proof of Organisation <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg md:rounded-xl p-4 md:p-6 text-center bg-gradient-to-br from-[#f5f3ff]/50 dark:from-[#f5f3ff]/10 to-[#ede9fe]/50 dark:to-[#ede9fe]/10 hover:border-[#8b5cf6] transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="proofDocument"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'proofDocument');
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor="proofDocument" className="cursor-pointer">
                        {uploadedFiles.proofDocument ? (
                          <div className="text-[#10b981]">
                            <Check className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                            <p className="text-[11px] md:text-[13px]">File uploaded successfully!</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[#8b5cf6]" />
                            <p className="text-[11px] md:text-[13px] text-muted-foreground">
                              {uploading ? 'Uploading...' : 'College ID, Letter from Institution, etc.'}
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </>
              )}

              {selectedOrg === "informal" && (
                <div>
                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Group Name</Label>
                    <Input
                      name="name"

                      placeholder="Green Warriors Nashik"
                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Area / Locality <span className="text-muted-foreground">(Optional)</span></Label>
                    <Input
                      name="areaLocality"

                      placeholder="Nashik, Maharashtra"
                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">
                      Coordinator / Representative Name <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      name="representativeName"

                      placeholder="Rahul Sharma"
                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Mobile Number</Label>
                    <div className="flex gap-1.5 md:gap-2">
                      <div className="h-10 md:h-14 px-3 md:px-4 bg-muted rounded-lg md:rounded-xl flex items-center text-muted-foreground text-[12px] md:text-[15px] font-medium shrink-0">
                        +91
                      </div>
                      <Input
                        name="phone"

                        type="tel"
                        placeholder="9876543210"
                        className="flex-1 h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Email</Label>
                    <Input
                      name="email"

                      type="email"
                      placeholder="contact@group.com"
                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">
                      Upload Verification Proof <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-lg md:rounded-xl p-4 md:p-6 text-center bg-gradient-to-br from-[#f5f3ff]/50 dark:from-[#f5f3ff]/10 to-[#ede9fe]/50 dark:to-[#ede9fe]/10 hover:border-[#8b5cf6] transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="proofDocument"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'proofDocument');
                        }}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label htmlFor="proofDocument" className="cursor-pointer">
                        {uploadedFiles.proofDocument ? (
                          <div className="text-[#10b981]">
                            <Check className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                            <p className="text-[11px] md:text-[13px]">File uploaded successfully!</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-[#8b5cf6]" />
                            <p className="text-[11px] md:text-[13px] text-muted-foreground">
                              {uploading ? 'Uploading...' : 'Social media URL, certificate, etc.'}
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrg === "individual" && (
                <>
                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Full Name</Label>
                    <Input
                      name="name"

                      placeholder="Rajesh Kumar"
                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#10b981]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Email</Label>
                    <Input
                      type="email"
                      name="email"

                      placeholder="rajesh@email.com"
                      className="h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#10b981]"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">Phone Number</Label>
                    <div className="flex gap-1.5 md:gap-2">
                      <div className="h-10 md:h-14 px-3 md:px-4 bg-muted rounded-lg md:rounded-xl flex items-center text-muted-foreground text-[12px] md:text-[15px] font-medium shrink-0">
                        +91
                      </div>
                      <Input
                        name="phone"

                        type="tel"
                        placeholder="9876543210"
                        className="flex-1 h-10 md:h-14 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#10b981]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label className="text-[10px] md:text-xs text-muted-foreground font-normal">
                      Why do you want to join? <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Textarea
                      name="intentDescription"
                      placeholder="Tell us about your intent - what type of events you want to create, your passion for volunteering, etc."
                      className="min-h-25 md:min-h-30 bg-muted border-0 rounded-lg md:rounded-xl text-[13px] md:text-[17px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-[#10b981] resize-none"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || uploading}
                className="w-full h-10 md:h-12 bg-gradient-to-r from-[#ff6b6b] to-[#ee5a5a] hover:from-[#ff5252] hover:to-[#e04848] text-white text-[13px] md:text-[17px] font-medium rounded-full mt-3 md:mt-6 shadow-lg shadow-[#ff6b6b]/25 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                  </span>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section >
  )
}