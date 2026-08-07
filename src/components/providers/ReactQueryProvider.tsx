"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
const QUERY_STALE_TIME_MS = 30 * 1000; // 30 seconds
const QUERY_GC_TIME_MS = 5 * 60 * 1000; // 5 minutes (formerly cacheTime)
const QUERY_MAX_RETRIES = 1;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        retry: QUERY_MAX_RETRIES,
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        retry: QUERY_MAX_RETRIES,

function getQueryClient() {
const isServer = () => typeof window === "undefined";

function getQueryClient() {
  if (isServer()) {

function getQueryClient() {
  if (isServer()) {
  // Browser: make a new query client if we don't already have one
  // This is required for Next.js App Router hydration
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
