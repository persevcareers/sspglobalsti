"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fadeIn } from "@/lib/animations";

function PulseDiv({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <motion.div variants={fadeIn}>
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <PulseDiv className="h-10 w-full rounded-lg bg-accent" />
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <PulseDiv className="h-12 w-full rounded-lg bg-accent/60" />
        </motion.div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <motion.div variants={fadeIn}>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <PulseDiv className="h-64 w-full rounded-lg bg-accent/40" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PageSkeleton() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className="space-y-6"
    >
      <motion.div
        variants={fadeIn}
        className="flex items-center justify-between"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </motion.div>
      <motion.div
        variants={fadeIn}
        className="grid gap-4 md:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </motion.div>
      <motion.div variants={fadeIn}>
        <TableSkeleton />
      </motion.div>
    </motion.div>
  );
}
